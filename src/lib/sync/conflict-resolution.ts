import { mapRowToRecord } from "@/lib/sync/mappers";
import * as queueDb from "@/lib/sync/queue";
import { applyLocalResolution, applyRemoteAdoption, notifyConflictsChanged } from "@/lib/sync/runtime";
import { SYNC_TABLE_BY_ENTITY } from "@/lib/sync/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ConflictEntry, ConflictResolutionChoice, ResolveConflictResult } from "@/types/conflict";

interface RecordWithId {
  id: string;
  [key: string]: unknown;
}

/**
 * Résolution d'un conflit (F1.7) — réutilise entièrement le moteur existant :
 * - « conserver distant » : adoption silencieuse (comme un pull), rien à pousser.
 * - « conserver local » / « fusion manuelle » : la valeur finale est appliquée via le chemin
 *   d'édition normal du magasin, donc détectée et ré-enfilée par le diff existant
 *   (`useSyncedPersistedState`) — c'est la file de synchronisation F1.4 qui envoie réellement
 *   le résultat, jamais une seconde file. Hors ligne, l'opération reste "en attente" et
 *   repart automatiquement via `ensureSyncTriggers` au retour de la connexion, exactement
 *   comme n'importe quelle autre modification locale.
 *
 * Avant toute écriture, la version distante est relue pour vérifier qu'elle n'a pas encore
 * changé depuis que l'utilisateur compare les versions — jamais de décision figée sur des
 * données obsolètes.
 */
export async function resolveConflict(
  entry: ConflictEntry,
  choice: ConflictResolutionChoice,
  mergedRecord?: Record<string, unknown>
): Promise<ResolveConflictResult> {
  if (choice === "defer") return { error: null };

  const table = SYNC_TABLE_BY_ENTITY[entry.entityType];
  const isOnline = typeof navigator === "undefined" || navigator.onLine;
  let freshRemote: Record<string, unknown> | null = null;

  if (isOnline) {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.from(table).select("*").eq("id", entry.id).maybeSingle();
    if (error) return { error: error.message };
    freshRemote = data ?? null;

    const knownRevision = entry.remoteRow.revision;
    if (freshRemote && knownRevision !== undefined && freshRemote.revision !== knownRevision) {
      // La version distante a encore changé pendant la comparaison : on ne décide jamais sur
      // des données obsolètes — la résolution est annulée, l'appelant doit redemander un choix.
      return { error: "stale", staleRemote: freshRemote };
    }
  }

  const effectiveRemote = freshRemote ?? entry.remoteRow;

  if (choice === "keep_remote") {
    if (!effectiveRemote || Object.keys(effectiveRemote).length === 0) {
      return { error: "Cet élément n'existe plus côté distant — impossible de conserver la version distante." };
    }
    const mapped = mapRowToRecord(effectiveRemote) as RecordWithId;
    applyRemoteAdoption(entry.entityType, mapped);
    await queueDb.setSyncState(
      entry.id,
      entry.entityType,
      effectiveRemote.revision as number,
      effectiveRemote.updated_at as string
    );
    notifyConflictsChanged();
    return { error: null };
  }

  // "keep_local" ou "merged".
  const finalRecord = (choice === "merged" ? mergedRecord : entry.local) as RecordWithId | undefined;
  if (!finalRecord) {
    return { error: "La version locale de cet élément est introuvable." };
  }

  if (effectiveRemote && Object.keys(effectiveRemote).length > 0) {
    // Aligne la révision attendue sur celle vérifiée fraîche à l'instant : le prochain envoi
    // par la file existante utilisera cette révision comme condition d'écriture optimiste,
    // exactement comme pour toute autre modification (voir processOperation dans runtime.ts).
    await queueDb.primeRevisionForResolution(
      entry.id,
      entry.entityType,
      effectiveRemote.revision as number,
      effectiveRemote.updated_at as string
    );
  }

  applyLocalResolution(entry.entityType, finalRecord);
  notifyConflictsChanged();
  return { error: null };
}
