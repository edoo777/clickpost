import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export interface UploadAvatarResult {
  url: string | null;
  error: string | null;
}

/** Téléverse un avatar dans le dossier propre à l'utilisateur (RLS : écriture limitée à ce dossier). */
export async function uploadAvatar(userId: string, file: File): Promise<UploadAvatarResult> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { url: null, error: "Format d'image non pris en charge (PNG, JPEG, WEBP ou GIF)." };
  }
  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return { url: null, error: "L'image dépasse la taille maximale de 5 Mo." };
  }

  const supabase = createSupabaseBrowserClient();
  const extension = file.name.split(".").pop() ?? "png";
  const path = `${userId}/avatar-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (uploadError) {
    return { url: null, error: uploadError.message };
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
