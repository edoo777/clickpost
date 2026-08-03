import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

const BUCKET = "publication-media";

export interface DownloadedMedia {
  bytes: ArrayBuffer;
  contentType: string;
}

/**
 * Télécharge un média déjà présent dans le bucket privé `publication-media` via le rôle
 * service_role plutôt qu'une URL signée — un flux de publication doit pouvoir s'exécuter en
 * arrière-plan (programmation, voir Section 7) sans dépendre d'une session utilisateur en cours
 * ni d'une URL signée nécessairement encore valide au moment de l'exécution. Ne transmet jamais
 * cette URL à une plateforme tierce : les octets réels sont téléversés directement chez elle.
 */
export async function downloadPublicationMedia(storagePath: string, fallbackContentType: string): Promise<DownloadedMedia | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase.storage.from(BUCKET).download(storagePath);
  if (error || !data) return null;
  return { bytes: await data.arrayBuffer(), contentType: data.type || fallbackContentType };
}
