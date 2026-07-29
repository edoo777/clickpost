-- F1.3 — Durcissement sécurité (suite aux résultats de `supabase db advisors`)
-- N'altère aucune migration déjà appliquée : ajout de restrictions supplémentaires
-- sur des objets créés par les deux migrations F1.3 précédentes.

-- ---------------------------------------------------------------------------
-- Bucket avatars : le bucket est déjà public (lecture par URL directe déjà
-- fonctionnelle sans policy RLS, via le chemin de service dédié aux buckets
-- publics). La policy SELECT ci-dessous n'apportait donc que la capacité de
-- lister l'intégralité du contenu du bucket — non voulue, on la retire.
-- ---------------------------------------------------------------------------
drop policy if exists "avatar_public_read" on storage.objects;

-- ---------------------------------------------------------------------------
-- Fonctions internes aux politiques RLS : ne doivent jamais être appelables
-- directement par un visiteur non connecté (rôle anon) via /rest/v1/rpc/...
-- Le rôle authenticated conserve l'accès, nécessaire à l'évaluation des
-- politiques RLS sur ses propres requêtes.
-- ---------------------------------------------------------------------------
revoke execute on function public.is_workspace_member(uuid) from public;
grant execute on function public.is_workspace_member(uuid) to authenticated;

revoke execute on function public.is_workspace_admin(uuid) from public;
grant execute on function public.is_workspace_admin(uuid) to authenticated;

revoke execute on function public.ensure_default_workspace() from public;
grant execute on function public.ensure_default_workspace() to authenticated;

-- handle_new_user() (F1.1) est un déclencheur uniquement : aucun client,
-- connecté ou non, ne doit pouvoir l'invoquer directement.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
