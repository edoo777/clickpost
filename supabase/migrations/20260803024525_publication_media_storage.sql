-- Bucket de stockage pour les médias de « Nouvelle publication » — privé (aucune exposition
-- publique permanente, contrairement au bucket "avatars"), isolé par workspace. Chemin
-- conceptuel : workspaceId/brandId-ou-"sans-marque"/publicationId/mediaId.ext. N'insère aucune
-- donnée dans les tables applicatives : publications.media reste une colonne jsonb existante,
-- seuls les fichiers eux-mêmes vivent dans ce bucket.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'publication-media',
  'publication-media',
  false,
  209715200, -- 200 Mo — limite haute du bucket (vidéo) ; la limite image (10 Mo) est appliquée
             -- côté application (voir src/lib/publication-media.ts), Storage ne distingue pas la
             -- limite par type de fichier au sein d'un même bucket.
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do nothing;

-- RLS storage.objects : le premier segment du chemin (workspaceId) doit correspondre à un
-- workspace dont l'utilisateur authentifié est membre actif — jamais fait confiance à un
-- workspaceId fourni par le client au-delà de cette vérification serveur, appliquée à chaque
-- opération (lecture, écriture, remplacement, suppression). Un chemin dont le premier segment
-- n'est pas un uuid valide échoue la conversion ::uuid et est donc refusé (échec fermé, jamais
-- ouvert). Même fonction is_workspace_member déjà utilisée par toutes les tables applicatives.

create policy "publication_media_select_by_membership" on storage.objects
  for select using (
    bucket_id = 'publication-media'
    and public.is_workspace_member(((storage.foldername(name))[1])::uuid)
  );

create policy "publication_media_insert_by_membership" on storage.objects
  for insert with check (
    bucket_id = 'publication-media'
    and public.is_workspace_member(((storage.foldername(name))[1])::uuid)
  );

create policy "publication_media_update_by_membership" on storage.objects
  for update using (
    bucket_id = 'publication-media'
    and public.is_workspace_member(((storage.foldername(name))[1])::uuid)
  );

create policy "publication_media_delete_by_membership" on storage.objects
  for delete using (
    bucket_id = 'publication-media'
    and public.is_workspace_member(((storage.foldername(name))[1])::uuid)
  );
