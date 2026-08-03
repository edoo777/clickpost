-- Corrige une régression réelle introduite par la Phase D (architecture de publication) : le
-- champ Publication.publishAttempts, ajouté côté TypeScript sans colonne correspondante, aurait
-- fait échouer toute synchronisation Supabase d'une publication marquée publiée/échouée
-- manuellement (mapRecordToRow envoie mécaniquement chaque champ du record vers une colonne du
-- même nom en snake_case — voir src/lib/sync/mappers.ts). Ajoute aussi content_type, nécessaire à
-- la répartition par type de contenu de la Phase F (Analyse). Additif uniquement : aucune colonne
-- retirée, aucune donnée existante modifiée. Même convention que ideas.content_type (texte libre,
-- sans contrainte de valeurs) et que media/comments/history déjà en jsonb sur cette table.

alter table public.publications
  add column if not exists publish_attempts jsonb not null default '[]'::jsonb,
  add column if not exists content_type text;
