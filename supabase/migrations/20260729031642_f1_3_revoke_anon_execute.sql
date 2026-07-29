-- F1.3 — Correctif : Supabase accorde EXECUTE au rôle anon par défaut sur toute
-- nouvelle fonction (privilège explicite, pas hérité de PUBLIC) — la révocation
-- depuis PUBLIC de la migration précédente ne suffisait donc pas. Révocation
-- explicite et directe du rôle anon ici ; authenticated conserve l'accès.
revoke execute on function public.is_workspace_member(uuid) from anon;
revoke execute on function public.is_workspace_admin(uuid) from anon;
revoke execute on function public.ensure_default_workspace() from anon;
