import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

const BUCKET = "publication-media";

export interface DownloadedMedia {
  bytes: ArrayBuffer;
  contentType: string;
}

/**
 * Télécharge un média déjà présent dans le bucket privé `publication-media` via le rôle
 * service_role plutôt qu'une URL signée — un flux de publication doit pouvoir s'exécuter en
 * arrière-plan (programmation) sans dépendre d'une session utilisateur en cours ni d'une URL
 * signée nécessairement encore valide au moment de l'exécution. Ne transmet jamais cette URL à
 * une plateforme tierce : les octets réels sont téléversés directement chez elle.
 *
 * Copie générique de `src/lib/linkedin/media.ts` (logique déjà indépendante de LinkedIn) —
 * dupliquée plutôt que réutilisée directement, pour ne jamais risquer de casser LinkedIn.
 */
export async function downloadPublicationMedia(storagePath: string, fallbackContentType: string): Promise<DownloadedMedia | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase.storage.from(BUCKET).download(storagePath);
  if (error || !data) return null;
  return { bytes: await data.arrayBuffer(), contentType: data.type || fallbackContentType };
}

/**
 * URL signée temporaire vers un média déjà présent dans le bucket privé — nécessaire pour les
 * plateformes dont l'API de publication récupère elle-même les octets depuis une URL publique
 * plutôt que d'accepter un envoi direct d'octets (ex. Instagram Graph API : `image_url`/
 * `video_url` sur le conteneur média). Jamais une URL permanente : `expiresInSeconds` doit rester
 * courte (juste assez pour laisser la plateforme distante récupérer le fichier une fois), et
 * cette fonction ne doit jamais être appelée pour une plateforme qui accepte un envoi direct
 * d'octets (LinkedIn, TikTok, X, YouTube) — voir le fournisseur concerné.
 */
export async function getSignedPublicationMediaUrl(storagePath: string, expiresInSeconds = 600): Promise<string | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, expiresInSeconds);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
