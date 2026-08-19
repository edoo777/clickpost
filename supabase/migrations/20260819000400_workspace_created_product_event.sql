-- Émet l'événement produit "workspace_created" uniquement lorsque ensure_default_workspace()
-- crée réellement un nouveau workspace (v_is_new = true), jamais sur un appel idempotent qui
-- retrouve un workspace existant. Remplace intégralement le corps de la fonction (additif au
-- comportement, migration F1.3 d'origine inchangée dans son intention).
create or replace function public.ensure_default_workspace()
returns table (workspace_id uuid, is_new boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace_id uuid;
  v_is_new boolean := false;
begin
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
    on conflict (workspace_id, user_id) do nothing;

    insert into public.workspace_branding (workspace_id)
    values (v_workspace_id)
    on conflict (workspace_id) do nothing;

    insert into public.product_events (event_name, user_id, workspace_id)
    values ('workspace_created', auth.uid(), v_workspace_id);

    v_is_new := true;
  end if;

  update public.profiles
  set active_workspace_id = v_workspace_id
  where id = auth.uid() and (active_workspace_id is distinct from v_workspace_id);

  return query select v_workspace_id, v_is_new;
end;
$$;
