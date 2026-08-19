-- Correctif additif suite à `db advisors` après la migration précédente : deux nouvelles alertes
-- WARN, corrigées ici en suivant le même patron que F1.3 (`20260729031642_f1_3_revoke_anon_execute.sql`).

-- `bump_updated_at()` n'avait pas de `search_path` fixe (contrairement à `bump_revision()`).
create or replace function public.bump_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- `ensure_default_subscription()` ne doit être invoquée que par le trigger sur `workspaces`
-- (l'exécution d'un trigger ne dépend pas des droits EXECUTE du rôle appelant) — jamais
-- directement via /rest/v1/rpc par un utilisateur authentifié ou anonyme.
revoke execute on function public.ensure_default_subscription() from anon;
revoke execute on function public.ensure_default_subscription() from authenticated;
