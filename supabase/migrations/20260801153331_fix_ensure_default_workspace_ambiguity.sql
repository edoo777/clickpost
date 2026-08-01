-- Corrige ensure_default_workspace() : les instructions ON CONFLICT (workspace_id, ...) à
-- l'intérieur de la fonction sont ambiguës, car `workspace_id` est aussi le nom d'une colonne de
-- sortie de RETURNS TABLE(workspace_id uuid, is_new boolean) — PL/pgSQL ne peut pas distinguer
-- ce paramètre de sortie de la colonne de table du même nom à cet endroit précis
-- (erreur 42702 « column reference "workspace_id" is ambiguous », reproduite et confirmée en
-- transaction annulée, aucune donnée persistée).
--
-- Correction ciblée : qualifie les deux cibles ON CONFLICT par le nom réel de leur contrainte
-- (vérifié en base) au lieu de leur liste de colonnes — élimine l'ambiguïté sans changer la
-- forme externe de la fonction (mêmes colonnes de retour, mêmes appelants côté application,
-- aucun changement client nécessaire). Ajoute aussi un refus explicite si aucun utilisateur
-- n'est authentifié, au lieu de laisser `auth.uid()` NULL se propager silencieusement.
--
-- Additif/ciblé : CREATE OR REPLACE FUNCTION uniquement, aucune table modifiée, aucune donnée
-- touchée, RLS inchangée, droits d'exécution inchangés (déjà accordés à `authenticated`).

create or replace function public.ensure_default_workspace()
returns table(workspace_id uuid, is_new boolean)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_workspace_id uuid;
  v_is_new boolean := false;
begin
  if auth.uid() is null then
    raise exception 'ensure_default_workspace: utilisateur non authentifié' using errcode = '28000';
  end if;

  perform pg_advisory_xact_lock(hashtext(auth.uid()::text));

  select p.active_workspace_id into v_workspace_id
  from public.profiles p
  where p.id = auth.uid();

  if v_workspace_id is null then
    select wm.workspace_id into v_workspace_id
    from public.workspace_members wm
    where wm.user_id = auth.uid()
    order by wm.joined_at asc
    limit 1;
  end if;

  if v_workspace_id is null then
    insert into public.workspaces (name, created_by)
    values ('Mon espace de travail', auth.uid())
    returning id into v_workspace_id;

    insert into public.workspace_members (workspace_id, user_id, role, status)
    values (v_workspace_id, auth.uid(), 'owner', 'active')
    on conflict on constraint workspace_members_workspace_id_user_id_key do nothing;

    insert into public.workspace_branding (workspace_id)
    values (v_workspace_id)
    on conflict on constraint workspace_branding_pkey do nothing;

    v_is_new := true;
  end if;

  update public.profiles
  set active_workspace_id = v_workspace_id
  where id = auth.uid() and (active_workspace_id is distinct from v_workspace_id);

  return query select v_workspace_id, v_is_new;
end;
$function$;
