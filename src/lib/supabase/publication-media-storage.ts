import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Téléversement direct au navigateur vers Supabase Storage (même patron que
 * lib/supabase/storage.ts pour les avatars) — jamais de proxy via une route Next.js pour le
 * transfert du fichier lui-même. La sécurité réelle vient des politiques RLS sur storage.objects
 * (voir la migration associée) : un chemin ne peut être lu/écrit/supprimé que si son premier
 * segment (workspaceId) correspond à un workspace dont l'utilisateur authentifié est membre —
 * jamais fait confiance à un workspaceId fourni par le client au-delà de cette vérification
 * serveur (Postgres), qui s'applique à chaque opération quel que soit le chemin demandé.
 */

const BUCKET = "publication-media";

export interface PublicationMediaUploadResult {
  path: string | null;
  error: string | null;
}

/** Construit le chemin conceptuel workspaceId/brandId/publicationId/mediaId.ext — brandId vaut
 * "sans-marque" pour une publication ponctuelle, jamais une valeur devinée. */
export function buildPublicationMediaPath(
  workspaceId: string,
  brandId: string | undefined,
  publicationId: string,
  mediaId: string,
  extension: string
): string {
  const brandSegment = brandId && brandId.trim().length > 0 ? brandId : "sans-marque";
  return `${workspaceId}/${brandSegment}/${publicationId}/${mediaId}.${extension}`;
}

/**
 * Téléverse un média avec suivi de progression réel — utilise directement l'API REST Storage de
 * Supabase via XMLHttpRequest (le SDK JS n'expose pas d'évènement de progression pour l'upload),
 * avec le jeton de la session authentifiée courante. Mêmes politiques RLS que tout autre appel
 * au bucket : aucun contournement, aucune clé élevée utilisée ici.
 */
export async function uploadPublicationMediaWithProgress(
  path: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<{ error: string | null }> {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) return { error: "Session expirée — reconnectez-vous puis réessayez." };

  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!projectUrl || !anonKey) return { error: "Configuration Supabase manquante." };

  const url = `${projectUrl}/storage/v1/object/${BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", anonKey);
    xhr.setRequestHeader("x-upsert", "true");
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve({ error: null });
      } else {
        resolve({ error: `Téléversement échoué (statut ${xhr.status}).` });
      }
    };
    xhr.onerror = () => resolve({ error: "Erreur réseau pendant le téléversement." });
    xhr.send(file);
  });
}

/** URL signée temporaire pour l'affichage — le bucket est privé, jamais d'URL publique
 * permanente. Valide 1 heure par défaut, régénérée à chaque affichage. */
export async function getPublicationMediaSignedUrl(path: string, expiresInSeconds = 3600): Promise<string | null> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresInSeconds);
  if (error || !data) return null;
  return data.signedUrl;
}

export async function deletePublicationMediaFile(path: string): Promise<{ error: string | null }> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  return { error: error?.message ?? null };
}

/** Nettoyage complet des médias d'une publication (annulation d'une création, suppression
 * définitive) — jamais de suppression en cascade non contrôlée : uniquement le sous-dossier exact
 * de cette publication, jamais celui d'une autre. */
export async function deleteAllPublicationMedia(workspaceId: string, brandId: string | undefined, publicationId: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const brandSegment = brandId && brandId.trim().length > 0 ? brandId : "sans-marque";
  const prefix = `${workspaceId}/${brandSegment}/${publicationId}`;
  const { data } = await supabase.storage.from(BUCKET).list(prefix);
  if (data && data.length > 0) {
    await supabase.storage.from(BUCKET).remove(data.map((entry) => `${prefix}/${entry.name}`));
  }
}
