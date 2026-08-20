import { classifySyncError } from "@/lib/sync/classify-sync-error";
import { mapRecordToRow, mapRowToRecord } from "@/lib/sync/mappers";
import * as queueDb from "@/lib/sync/queue";
import { isSyncableRecordId, stripSeedReferences } from "@/lib/sync/is-user-created";
import { zonedNaiveToUtcInstant, utcInstantToZonedNaive } from "@/lib/scheduling-time";
import { SYNC_TABLE_BY_ENTITY, type SyncEntityType, type SyncOperationKind, type SyncStatusState } from "@/lib/sync/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const BROADCAST_CHANNEL_NAME = "clickpost-sync";

/**
 * Ordre de synchronisation par dépendance réelle (voir les FK Supabase) — un enregistrement
 * référencé (ex. `ideas`) doit toujours atteindre Supabase avant tout enregistrement qui le
 * référence (ex. `topics.idea_id`, `idea_notes.converted_idea_id`), sinon l'insertion/mise à jour
 * de ce dernier échoue avec une violation de contrainte de clé étrangère — même si les deux
 * opérations ont été créées dans la même action utilisateur. Priorité plus basse = synchronisé
 * plus tôt. Entités sans dépendance connue entre elles : même priorité, ordre relatif conservé
 * (tri stable).
 */
export const SYNC_PRIORITY: Record<SyncEntityType, number> = {
  accounts: 0,
  brands: 0,
  campaigns: 0,
  themes: 0,
  topicBatches: 0,
  workflowStages: 0,
  savedViews: 0,
  importantDates: 0,
  savedTrends: 0,
  reports: 0,
  // `posts` avant `ideas` : une idée peut référencer sa publication (`ideas.publication_id`)
  // créée dans la même action (voir IdeaWorkshopView.handleCreatePublication).
  posts: 0,
  ideas: 1,
  // Référencent potentiellement une idée créée dans la même action (voir develop-idea.ts).
  topics: 2,
  ideaNotes: 2,
  contentVersions: 2,
};

let statusState: SyncStatusState = {
  status: "idle",
  pendingCount: 0,
  conflictCount: 0,
  lastSyncedAt: null,
  errorMessage: null,
  isPersistentError: false,
  hasPermissionError: false,
  hasBlockedOperations: false,
};

const listeners = new Set<() => void>();

function setStatus(patch: Partial<SyncStatusState>) {
  statusState = { ...statusState, ...patch };
  listeners.forEach((listener) => listener());
}

export function subscribeSyncStatus(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSyncStatusSnapshot(): SyncStatusState {
  return statusState;
}

export function getSyncStatusServerSnapshot(): SyncStatusState {
  return {
    status: "idle",
    pendingCount: 0,
    conflictCount: 0,
    lastSyncedAt: null,
    errorMessage: null,
    isPersistentError: false,
    hasPermissionError: false,
    hasBlockedOperations: false,
  };
}

// Contexte courant (workspace actif + utilisateur) — jamais de synchronisation sans les deux.
let currentWorkspaceId: string | null = null;
let currentUserId: string | null = null;
// Pull unique par workspace pour la session de navigateur — jamais un booléen global unique,
// sinon changer d'espace de travail actif n'aurait plus jamais tiré ses propres données.
let hasPulledThisSession = false;

export function getCurrentWorkspaceId(): string | null {
  return currentWorkspaceId;
}

export function getCurrentUserId(): string | null {
  return currentUserId;
}

export function configureSyncContext(workspaceId: string | null, userId: string | null) {
  const workspaceChanged = workspaceId !== currentWorkspaceId;
  currentWorkspaceId = workspaceId;
  currentUserId = userId;

  if (workspaceChanged) {
    // Un changement d'espace de travail (y compris un retour à null) ne doit jamais laisser
    // affiché un statut ou un indicateur "déjà tiré" hérités du contexte précédent — y compris
    // les catégories affinées (permission, opérations bloquées) ajoutées pour la file locale.
    hasPulledThisSession = false;
    if (workspaceId) {
      setStatus({
        status: "idle",
        errorMessage: null,
        isPersistentError: false,
        hasPermissionError: false,
        hasBlockedOperations: false,
      });
    }
  }

  if (workspaceId && userId) {
    void processSyncQueue();
    void pullAndMerge();
  }
}

type WorkspaceReloader = () => Promise<void>;
let workspaceReloader: WorkspaceReloader | null = null;

/** Permet à WorkspaceSessionProvider de s'enregistrer sans dépendance circulaire (runtime.ts ne
 * doit jamais importer workspace-provider.tsx) — utilisé uniquement par retrySync() lorsque le
 * contexte workspace est manquant au moment du clic sur « Réessayer ». */
export function registerWorkspaceReloader(reloader: WorkspaceReloader | null) {
  workspaceReloader = reloader;
}

// Notifié à chaque nouveau conflit détecté ou résolu (F1.7) — le Centre des conflits et les
// badges de navigation s'y abonnent pour rester à jour sans sonder la base à intervalles.
const conflictListeners = new Set<() => void>();

export function subscribeConflicts(listener: () => void) {
  conflictListeners.add(listener);
  return () => {
    conflictListeners.delete(listener);
  };
}

export function notifyConflictsChanged() {
  conflictListeners.forEach((listener) => listener());
}

let broadcastChannel: BroadcastChannel | null = null;
function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
  broadcastChannel ??= new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  return broadcastChannel;
}

/** Ajoute une opération à la file locale et déclenche une tentative de synchronisation. */
export function enqueueSyncOperation(
  entityType: SyncEntityType,
  operation: SyncOperationKind,
  recordId: string,
  payload?: Record<string, unknown>
) {
  void queueDb
    .enqueueOperation({ entityType, operation, recordId, payload, enqueuedAt: new Date().toISOString() })
    .then(async () => {
      const pendingCount = await queueDb.countPendingOperations();
      setStatus({ status: "pending", pendingCount });
      getBroadcastChannel()?.postMessage({ type: "sync-changed" });
      void processSyncQueue();
    });
}

let isProcessing = false;

/** Purge toute opération bloquée devenue obsolète pour le même enregistrement — une fois qu'une
 * opération plus récente pour ce couple entité/identifiant a réellement abouti, l'état distant
 * reflète déjà ce couple : une ancienne opération bloquée en attente pour la même cible n'a plus
 * aucun effet utile à rejouer (voir la règle "ne supprimer que si déjà appliqué à distance ou
 * sans modification utile"). Ne touche jamais aux opérations d'autres enregistrements. */
async function removeBlockedSiblings(entityType: SyncEntityType, recordId: string, keepQueueId: number | undefined) {
  const operations = await queueDb.getAllOperations();
  for (const sibling of operations) {
    if (sibling.queueId === keepQueueId) continue;
    if (!sibling.blocked) continue;
    if (sibling.entityType !== entityType || sibling.recordId !== recordId) continue;
    if (sibling.queueId !== undefined) await queueDb.removeOperation(sibling.queueId);
  }
}

/** Vide la file locale vers Supabase. Aucune donnée locale n'est jamais supprimée ici :
 * un échec transitoire laisse l'opération en file pour une nouvelle tentative ultérieure ; un
 * échec définitif (voir classify-sync-error.ts) est marqué `blocked` — retiré de la reprise
 * automatique pour éviter la boucle infinie et le bruit de journalisation, mais jamais
 * supprimé ni perdu, et toujours rejouable explicitement via « Réessayer » (voir retrySync). */
export async function processSyncQueue() {
  if (isProcessing) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    setStatus({ status: "offline" });
    return;
  }
  if (!currentWorkspaceId || !currentUserId) return;
  if (!queueDb.isSyncQueueAvailable()) return;

  isProcessing = true;
  try {
    const allOperations = await queueDb.getAllOperations();

    // Purge défensive : une opération portant sur un identifiant de donnée de démonstration
    // (registre explicite, voir seed-registry.ts) n'aurait jamais dû être mise en file — que ce
    // soit une opération antérieure à ce garde-fou (déjà présente en file avant son ajout) ou
    // réintroduite autrement, elle ne peut jamais aboutir (l'id n'est pas un UUID valide côté
    // Supabase). On la retire définitivement plutôt que de la laisser se bloquer et afficher
    // indéfiniment « Données locales à réparer » pour une donnée qui n'a jamais eu vocation à
    // être synchronisée — jamais une donnée réelle exclue, seule la forme de l'id du registre
    // explicite compte ici.
    for (const op of allOperations) {
      if (isSyncableRecordId(op.recordId)) continue;
      if (op.queueId !== undefined) await queueDb.removeOperation(op.queueId);
    }
    // Réparation automatique, bornée aux entités concernées par le correctif de dépendance
    // ci-dessus (SYNC_PRIORITY, stripDanglingReferences) : une opération `topics`/`ideaNotes`/
    // `ideas` restée bloquée AVANT ce correctif (ex. la violation `topics_idea_id_fkey` ou
    // `ideas_publication_id_fkey` observées) mérite une vraie nouvelle chance à chaque passage
    // normal, pas seulement au clic explicite sur « Réessayer » — sinon la bannière « Données
    // locales à réparer » resterait affichée indéfiniment pour une situation déjà réparée côté
    // moteur. Jamais étendu aux autres entités : un blocage réellement permanent (permission
    // refusée, schéma incompatible) continue de n'être rejoué qu'à la demande explicite de
    // l'utilisateur.
    for (const op of allOperations) {
      if (!op.blocked) continue;
      if (op.entityType !== "topics" && op.entityType !== "ideaNotes" && op.entityType !== "ideas") continue;
      if (op.queueId !== undefined) await queueDb.updateOperation(op.queueId, { blocked: false, blockReason: undefined });
    }

    const operations = (await queueDb.getAllOperations()).filter((op) => isSyncableRecordId(op.recordId));

    if (operations.length === 0) {
      const conflictCount = await queueDb.countConflicts();
      setStatus({
        status: conflictCount > 0 ? "conflict" : "synced",
        pendingCount: 0,
        conflictCount,
        errorMessage: null,
        isPersistentError: false,
        hasPermissionError: false,
        hasBlockedOperations: false,
      });
      return;
    }

    // Tri stable par dépendance — jamais par confiance dans l'ordre d'enfilement local (déterminé
    // par l'ordre de déclaration des hooks React entre magasins, un détail d'implémentation non
    // garanti, voir la découverte du bug topics_idea_id_fkey). `ideas` doit toujours être
    // synchronisée avant tout ce qui peut la référencer (topics.idea_id, idea_notes.
    // converted_idea_id, content_versions.idea_id) ; `posts`/`topicBatches`/entités de base restent
    // prioritaires par rapport à `ideas` (ideas.publication_id/batch_id peuvent la référencer en
    // retour). Un tri stable préserve l'ordre relatif entre opérations de même priorité.
    const actionable = operations
      .filter((op) => !op.blocked)
      .sort((a, b) => SYNC_PRIORITY[a.entityType] - SYNC_PRIORITY[b.entityType]);
    const alreadyBlocked = operations.filter((op) => op.blocked);

    setStatus({ status: "syncing", pendingCount: operations.length });
    const supabase = createSupabaseBrowserClient();
    let hadTransientError = false;
    let hadPermanentError = false;
    let hadPermissionError = false;
    let lastErrorMessage: string | null = null;

    for (const op of actionable) {
      try {
        await processOperation(supabase, op);
        await removeBlockedSiblings(op.entityType, op.recordId, op.queueId);
      } catch (error) {
        const classified = classifySyncError(error, {
          operation: op.operation,
          entityType: op.entityType,
          recordId: op.recordId,
        });
        lastErrorMessage = classified.message;
        if (classified.isPermissionError) hadPermissionError = true;
        if (classified.permanent) hadPermanentError = true;
        else hadTransientError = true;
        if (op.queueId !== undefined) {
          await queueDb.updateOperation(op.queueId, {
            attempts: op.attempts + 1,
            lastError: classified.message,
            permanent: classified.permanent,
            // Un échec définitif ne peut pas réussir en rejouant le même payload : on arrête la
            // reprise automatique de CETTE opération précise plutôt que de la retenter — et donc
            // de la rejournaliser — à chaque déclencheur (réseau, visibilité, onglet) pour
            // toujours le même résultat.
            blocked: classified.permanent,
            blockReason: classified.permanent ? classified.message : undefined,
          });
        }
      }
    }

    const hasBlockedOperations = alreadyBlocked.length > 0 || hadPermanentError;
    const hasError = hadTransientError || hadPermanentError;
    const remaining = await queueDb.countPendingOperations();
    const conflictCount = await queueDb.countConflicts();
    setStatus({
      status: conflictCount > 0 ? "conflict" : remaining > 0 ? (hasError || hasBlockedOperations ? "error" : "syncing") : "synced",
      pendingCount: remaining,
      conflictCount,
      errorMessage: hasError ? lastErrorMessage : hasBlockedOperations ? (alreadyBlocked[0]?.blockReason ?? null) : null,
      isPersistentError: (hasError && hadPermanentError) || hasBlockedOperations,
      hasPermissionError: hadPermissionError,
      hasBlockedOperations,
      lastSyncedAt: remaining === 0 ? new Date().toISOString() : statusState.lastSyncedAt,
    });
  } finally {
    isProcessing = false;
  }
}

/**
 * Point d'entrée du bouton « Réessayer » — implémente la procédure complète attendue : vérifie
 * la connexion, recharge la session/le workspace si le contexte est manquant (jamais un no-op
 * silencieux), reprend les opérations en attente, effectue un pull + fusion puis un push. Ne
 * marque jamais "synced" sans confirmation réelle : c'est processSyncQueue()/pullAndMerge() qui
 * décident du statut final, à partir des réponses Supabase effectivement reçues.
 */
export async function retrySync(): Promise<void> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    setStatus({ status: "offline" });
    return;
  }

  if ((!currentWorkspaceId || !currentUserId) && workspaceReloader) {
    try {
      await workspaceReloader();
    } catch {
      // Le rechargement gère déjà son propre état d'erreur côté WorkspaceSessionProvider ; on
      // retente quand même la suite ci-dessous plutôt que d'abandonner immédiatement.
    }
  }

  if (!currentWorkspaceId || !currentUserId) {
    setStatus({
      status: "error",
      errorMessage: "Espace de travail introuvable — rechargez la page ou reconnectez-vous.",
      isPersistentError: true,
    });
    return;
  }

  // Un clic explicite sur « Réessayer » est un signal de contrôle délibéré (l'utilisateur pense
  // que la situation a changé — permission accordée, schéma corrigé) : débloque toutes les
  // opérations mises de côté pour leur donner une vraie nouvelle chance, plutôt que de les
  // laisser bloquées indéfiniment en n'attendant qu'un déclencheur automatique qui ne les
  // reprendra jamais.
  await unblockAllOperations();
  hasPulledThisSession = false; // force un vrai pull, pas seulement un push, pour ce clic explicite.
  await pullAndMerge();
  await processSyncQueue();
}

async function unblockAllOperations() {
  const operations = await queueDb.getAllOperations();
  for (const op of operations) {
    if (!op.blocked) continue;
    if (op.queueId === undefined) continue;
    await queueDb.updateOperation(op.queueId, { blocked: false, blockReason: undefined });
  }
}

/** Colonnes portant une référence optionnelle vers un autre enregistrement synchronisé, par
 * entité — les seules relations connues à ce jour où l'enregistrement référencé peut être créé
 * puis référencé dans la même action utilisateur : une idée référençant `topics`/`ideaNotes`
 * (voir develop-idea.ts), et une publication référençant `ideas.publication_id` (voir
 * IdeaWorkshopView.handleCreatePublication — violation `ideas_publication_id_fkey` observée en
 * direct). `SYNC_PRIORITY` ci-dessus règle l'ordre normal ; ce filet de sécurité ne s'applique
 * qu'au cas résiduel où l'enregistrement référencé reste malgré tout introuvable localement (ex.
 * opération héritée d'avant ce correctif, ou enregistrement réellement supprimé entre-temps) —
 * jamais un cas normal. `ideas.derived_from_id`/`theme_id`/`batch_id` ne sont volontairement pas
 * couverts : aucune violation constatée en pratique pour ces colonnes (l'enregistrement référencé
 * préexiste toujours à l'action qui crée l'idée), donc pas de filet nécessaire tant qu'aucun cas
 * réel ne l'exige. */
const DANGLING_REFERENCE_RULES: Partial<Record<SyncEntityType, { column: string; targetEntity: SyncEntityType }[]>> = {
  topics: [{ column: "idea_id", targetEntity: "ideas" }],
  ideaNotes: [{ column: "converted_idea_id", targetEntity: "ideas" }],
  ideas: [{ column: "publication_id", targetEntity: "posts" }],
};

/**
 * Neutralise une référence qui n'existe nulle part localement (ni déjà synchronisée, ni encore en
 * attente d'envoi) — jamais une référence dont la cible est simplement en cours de synchronisation
 * (celle-ci reste intacte, `SYNC_PRIORITY` garantit qu'elle partira avant). Ne supprime jamais
 * l'enregistrement porteur : seule la référence dangereuse est mise à `null`, exactement comme
 * `stripSeedReferences` le fait déjà pour les identifiants de démonstration — même principe,
 * cause différente (cible réellement introuvable, pas une donnée de démonstration).
 */
function stripDanglingReferences(entityType: SyncEntityType, row: Record<string, unknown>): Record<string, unknown> {
  const rules = DANGLING_REFERENCE_RULES[entityType];
  if (!rules) return row;
  let result = row;
  for (const rule of rules) {
    const value = result[rule.column];
    if (typeof value !== "string" || value.length === 0) continue;
    if (getLocalRecordById(rule.targetEntity, value)) continue;
    result = { ...result, [rule.column]: null };
  }
  return result;
}

async function processOperation(
  supabase: ReturnType<typeof createSupabaseBrowserClient>,
  op: Awaited<ReturnType<typeof queueDb.getAllOperations>>[number]
) {
  const table = SYNC_TABLE_BY_ENTITY[op.entityType];
  const syncState = await queueDb.getSyncState(op.recordId);

  if (op.operation === "delete") {
    if (!syncState) {
      // Jamais synchronisé côté distant : rien à supprimer là-bas.
      if (op.queueId !== undefined) await queueDb.removeOperation(op.queueId);
      return;
    }
    const { data, error } = await supabase
      .from(table)
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", op.recordId)
      .eq("revision", syncState.lastSyncedRevision)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      await recordConflict(supabase, op.recordId, op.entityType, table);
      if (op.queueId !== undefined) await queueDb.removeOperation(op.queueId);
      return;
    }
    await queueDb.setSyncState(op.recordId, op.entityType, data.revision as number, data.updated_at as string);
    if (op.queueId !== undefined) await queueDb.removeOperation(op.queueId);
    return;
  }

  if (!op.payload) {
    if (op.queueId !== undefined) await queueDb.removeOperation(op.queueId);
    return;
  }
  const row = stripDanglingReferences(op.entityType, stripSeedReferences(mapRecordToRow(op.payload)));
  // `scheduled_for` est un timestamptz côté Supabase mais saisi localement comme une date-heure
  // naïve (champ datetime-local) interprétée dans `time_zone` — sans cette conversion, Postgres
  // l'interpréterait dans le fuseau de session (UTC), pas celui réellement choisi.
  if (op.entityType === "posts" && typeof row.scheduled_for === "string" && typeof row.time_zone === "string") {
    row.scheduled_for = zonedNaiveToUtcInstant(row.scheduled_for, row.time_zone).toISOString();
  }

  if (!syncState) {
    const { data, error } = await supabase
      .from(table)
      .insert({ ...row, workspace_id: currentWorkspaceId, created_by: currentUserId })
      .select()
      .maybeSingle();
    if (error) {
      if (error.code === "23505") {
        // Déjà créé distant (nouvelle tentative après un précédent succès non confirmé
        // localement) : on considère la révision 1 connue et on continuera en update ensuite.
        await queueDb.setSyncState(op.recordId, op.entityType, 1, new Date().toISOString());
      } else {
        throw error;
      }
    } else if (data) {
      await queueDb.setSyncState(op.recordId, op.entityType, data.revision as number, data.updated_at as string);
    }
    if (op.queueId !== undefined) await queueDb.removeOperation(op.queueId);
    return;
  }

  const { data, error } = await supabase
    .from(table)
    .update(row)
    .eq("id", op.recordId)
    .eq("revision", syncState.lastSyncedRevision)
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    await recordConflict(supabase, op.recordId, op.entityType, table);
    if (op.queueId !== undefined) await queueDb.removeOperation(op.queueId);
    return;
  }
  await queueDb.setSyncState(op.recordId, op.entityType, data.revision as number, data.updated_at as string);
  if (op.queueId !== undefined) await queueDb.removeOperation(op.queueId);
}

async function recordConflict(
  supabase: ReturnType<typeof createSupabaseBrowserClient>,
  recordId: string,
  entityType: SyncEntityType,
  table: string
) {
  const { data: remote } = await supabase.from(table).select("*").eq("id", recordId).maybeSingle();
  await queueDb.markConflict(recordId, entityType, remote ?? null);
  notifyConflictsChanged();
}

let triggersInitialized = false;

/** Déclencheurs globaux : reprise à la reconnexion, au retour d'onglet visible, et sur
 * notification d'un autre onglet — jamais dupliqués (un seul enregistrement process-wide). */
export function ensureSyncTriggers() {
  if (triggersInitialized || typeof window === "undefined") return;
  triggersInitialized = true;

  window.addEventListener("online", () => void processSyncQueue());
  window.addEventListener("offline", () => setStatus({ status: "offline" }));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void processSyncQueue();
  });

  const channel = getBroadcastChannel();
  if (channel) {
    channel.onmessage = (event) => {
      const message = event.data as { type?: string };
      if (message?.type === "sync-changed") void processSyncQueue();
    };
  }
}

// ---------------------------------------------------------------------------------------
// F1.6 — Pull et fusion au démarrage (moitié manquante du moteur : jusqu'ici, uniquement
// local → Supabase). Un pull unique par session, dès que le contexte est configuré ; les
// enregistrements distants sont fusionnés dans l'état React déjà monté des magasins via un
// registre de bindings (voir `registerSyncedEntity`, utilisé par `use-synced-state.ts`),
// jamais via une nouvelle lecture IndexedDB qui laisserait l'UI déjà affichée obsolète.
// ---------------------------------------------------------------------------------------

interface RecordWithId {
  id: string;
  [key: string]: unknown;
}

interface SyncedEntityBinding {
  getRecords: () => RecordWithId[];
  /** Application "silencieuse" (pull, adoption du distant) : jamais ré-enfilée comme un push. */
  applyMerged: (merged: RecordWithId[]) => void;
  /** Application "normale" (résolution conserver-local/fusion) : passe par le setState habituel,
   * donc détectée et ré-enfilée par le diff existant — c'est ainsi que la résolution est
   * envoyée à Supabase, sans aucune seconde file. */
  applyLocalEdit: (records: RecordWithId[]) => void;
}

const entityBindings = new Map<SyncEntityType, SyncedEntityBinding>();
// Lignes distantes reçues avant que le magasin correspondant ne soit monté (l'ordre de montage
// entre WorkspaceSessionProvider et les magasins synchronisés n'est pas garanti) — appliquées
// dès l'enregistrement tardif du binding, jamais perdues.
const bufferedRemoteRows = new Map<SyncEntityType, Record<string, unknown>[]>();

/** Appelé par `useSyncedPersistedState` à chaque montage/démontage d'un magasin synchronisé. */
export function registerSyncedEntity(entityType: SyncEntityType, binding: SyncedEntityBinding): () => void {
  entityBindings.set(entityType, binding);
  const buffered = bufferedRemoteRows.get(entityType);
  if (buffered) {
    bufferedRemoteRows.delete(entityType);
    void mergeEntityRows(entityType, buffered, binding);
  }
  return () => {
    if (entityBindings.get(entityType) === binding) entityBindings.delete(entityType);
  };
}

/** Lit la version locale courante d'un enregistrement (F1.7 — Centre des conflits). */
export function getLocalRecordById(entityType: SyncEntityType, id: string): RecordWithId | undefined {
  return entityBindings.get(entityType)?.getRecords().find((record) => record.id === id);
}

/** Lit tous les enregistrements locaux courants d'une entité (F1.8 — analyse d'import) —
 * ne fonctionne que si le magasin correspondant est monté (toujours vrai depuis le tableau
 * de bord, où l'assistant d'import est accessible). */
export function getAllLocalRecords(entityType: SyncEntityType): RecordWithId[] {
  return entityBindings.get(entityType)?.getRecords() ?? [];
}

function upsertLocalRecord(entityType: SyncEntityType, updated: RecordWithId, silent: boolean) {
  const binding = entityBindings.get(entityType);
  if (!binding) return;
  const current = binding.getRecords();
  const index = current.findIndex((record) => record.id === updated.id);
  const next = index === -1 ? [...current, updated] : current.map((record, i) => (i === index ? updated : record));
  if (silent) binding.applyMerged(next);
  else binding.applyLocalEdit(next);
}

/** Résolution "conserver local" / "fusion manuelle" (F1.7) : passe par le chemin d'édition
 * normal, donc ré-enfilée et poussée par le moteur de synchronisation existant. */
export function applyLocalResolution(entityType: SyncEntityType, record: RecordWithId) {
  upsertLocalRecord(entityType, record, false);
}

/** Résolution "conserver distant" (F1.7) : adoption silencieuse, comme un pull — rien à
 * pousser, la ligne distante fait déjà foi. */
export function applyRemoteAdoption(entityType: SyncEntityType, record: RecordWithId) {
  upsertLocalRecord(entityType, record, true);
}

/** Pull une fois par workspace pour la session de navigateur (voir hasPulledThisSession, remis à
 * zéro à chaque changement d'espace de travail et par retrySync()) : une requête par entité,
 * filtrée sur le workspace actif. */
export async function pullAndMerge() {
  if (hasPulledThisSession) return;
  if (!currentWorkspaceId || !currentUserId) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    setStatus({ status: "offline" });
    return;
  }
  hasPulledThisSession = true;

  setStatus({ status: "merging" });
  const supabase = createSupabaseBrowserClient();

  try {
    for (const [entityType, table] of Object.entries(SYNC_TABLE_BY_ENTITY) as [SyncEntityType, string][]) {
      const { data, error } = await supabase.from(table).select("*").eq("workspace_id", currentWorkspaceId);
      if (error || !data) continue;

      const binding = entityBindings.get(entityType);
      if (binding) {
        await mergeEntityRows(entityType, data, binding);
      } else {
        bufferedRemoteRows.set(entityType, data);
      }
    }
    const conflictCount = await queueDb.countConflicts();
    setStatus({
      status: conflictCount > 0 ? "conflict" : "synced",
      conflictCount,
      lastSyncedAt: new Date().toISOString(),
      errorMessage: null,
      isPersistentError: false,
    });
  } catch {
    // Échec réseau/partiel : on retentera au prochain appel de configureSyncContext
    // (ex. reconnexion) plutôt que de laisser la session sans aucune donnée distante.
    hasPulledThisSession = false;
  }
}

/** Inverse de la conversion appliquée au push (voir processOperation) : `scheduled_for` revient
 * de Supabase comme un instant UTC réel — reconverti vers la représentation naïve dans
 * `time_zone` pour un réaffichage correct dans le champ datetime-local local, sans dérive au
 * fil des allers-retours. */
function mapRemoteRowForEntity(entityType: SyncEntityType, row: Record<string, unknown>): Record<string, unknown> {
  const record = mapRowToRecord(row);
  if (entityType === "posts" && typeof record.scheduledFor === "string" && typeof record.timeZone === "string") {
    const instant = new Date(record.scheduledFor);
    if (!Number.isNaN(instant.getTime())) {
      record.scheduledFor = utcInstantToZonedNaive(instant, record.timeZone);
    }
  }
  return record;
}

/**
 * Fusionne des lignes distantes dans l'état local déjà monté d'une entité : jamais
 * d'écrasement d'un enregistrement dont une modification locale est encore dans la file
 * d'attente (l'envoi en cours reste prioritaire), dernier `updated_at` gagnant sinon,
 * suppression locale des enregistrements marqués `deleted_at` côté distant.
 */
async function mergeEntityRows(
  entityType: SyncEntityType,
  remoteRows: Record<string, unknown>[],
  binding: SyncedEntityBinding
): Promise<void> {
  const pendingOperations = await queueDb.getAllOperations();
  const pendingIds = new Set(
    pendingOperations.filter((op) => op.entityType === entityType).map((op) => op.recordId)
  );
  const conflictEntries = await queueDb.getAllConflicts();
  const conflictedIds = new Set(
    conflictEntries.filter((entry) => entry.entityType === entityType).map((entry) => entry.id)
  );

  const local = binding.getRecords();
  const result = [...local];
  let changed = false;
  const newlySyncedRows: Record<string, unknown>[] = [];

  for (const row of remoteRows) {
    const id = row.id as string;
    if (!isSyncableRecordId(id)) continue; // jamais une donnée de démonstration.
    if (pendingIds.has(id)) continue; // une modification locale est encore en attente d'envoi.
    // Un conflit non résolu ne doit jamais être silencieusement écrasé par un pull ultérieur —
    // il ne redevient éligible à la fusion qu'après une résolution explicite (F1.7).
    if (conflictedIds.has(id)) continue;

    const index = result.findIndex((record) => record.id === id);
    const isRemoteDeleted = Boolean(row.deleted_at);

    if (isRemoteDeleted) {
      if (index !== -1) {
        result.splice(index, 1);
        changed = true;
      }
      continue;
    }

    const remoteUpdatedAt = row.updated_at as string | undefined;
    if (index === -1) {
      result.push(mapRemoteRowForEntity(entityType, row) as RecordWithId);
      changed = true;
      newlySyncedRows.push(row);
      continue;
    }

    const localUpdatedAt = (result[index] as { updatedAt?: string }).updatedAt;
    const remoteIsNewer =
      !localUpdatedAt || (remoteUpdatedAt !== undefined && new Date(remoteUpdatedAt).getTime() > new Date(localUpdatedAt).getTime());
    if (remoteIsNewer) {
      result[index] = mapRemoteRowForEntity(entityType, row) as RecordWithId;
      changed = true;
      newlySyncedRows.push(row);
    }
  }

  if (!changed) return;

  binding.applyMerged(result);

  // Ces lignes viennent d'être reçues depuis Supabase : marquer leur révision comme déjà
  // synchronisée pour que `useSyncedPersistedState` ne les ré-enfile jamais comme un push.
  for (const row of newlySyncedRows) {
    await queueDb.setSyncState(row.id as string, entityType, row.revision as number, row.updated_at as string);
  }
}
