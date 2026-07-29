-- F1.3 — Onboarding, workspace et identité visuelle
-- Portée : complète profiles/workspaces, ajoute workspace_branding, le bucket de stockage
-- des avatars, et la fonction idempotente de création du premier espace de travail.
-- Ne modifie aucune colonne/table/politique de la migration F1.1 (20260729003507).

-- ---------------------------------------------------------------------------
-- profiles — champs manquants (nom affiché, avatar, poste, workspace actif).
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists display_name text,
  add column if not exists avatar_url text,
  add column if not exists job_title text,
  add column if not exists active_workspace_id uuid references public.workspaces(id);

-- ---------------------------------------------------------------------------
-- workspaces — champs d'onboarding (type d'usage, entreprise, secteur, réseaux,
-- objectifs, progression). RLS déjà en place (F1.1, écriture réservée aux admins).
-- ---------------------------------------------------------------------------
alter table public.workspaces
  add column if not exists usage_type text check (usage_type in ('solo', 'team', 'agency')),
  add column if not exists company_name text,
  add column if not exists industry text,
  add column if not exists social_platforms text[] not null default '{}',
  add column if not exists content_goals text[] not null default '{}',
  add column if not exists onboarding_step smallint not null default 1,
  add column if not exists onboarding_completed boolean not null default false;

-- ---------------------------------------------------------------------------
-- workspace_branding — identité visuelle personnalisable, 1-1 avec workspaces.
-- Valeurs par défaut = identité ClickPost actuelle (fond clair, sidebar très
-- sombre, violet-magenta) — sert aussi de cible pour « Restaurer l'identité ».
-- ---------------------------------------------------------------------------
create table public.workspace_branding (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  logo_url text,
  favicon_url text,
  color_primary text not null default '#7c3aed',
  color_secondary text not null default '#c026d3',
  color_accent text not null default '#ec4899',
  color_sidebar text not null default '#0e0a1a',
  color_button text not null default '#7c3aed',
  color_link text not null default '#7c3aed',
  font_heading text not null default 'Inter',
  font_body text not null default 'Inter',
  radius text not null default 'lg' check (radius in ('none', 'sm', 'md', 'lg', 'xl', 'full')),
  default_theme_mode text not null default 'system' check (default_theme_mode in ('light', 'dark', 'system')),
  updated_at timestamptz not null default now()
);

create trigger workspace_branding_set_updated_at
  before update on public.workspace_branding
  for each row execute function public.set_updated_at();

alter table public.workspace_branding enable row level security;

create policy "branding_select_by_membership" on public.workspace_branding
  for select using (public.is_workspace_member(workspace_id));

create policy "branding_insert_by_admin" on public.workspace_branding
  for insert with check (public.is_workspace_admin(workspace_id));

create policy "branding_update_by_admin" on public.workspace_branding
  for update using (public.is_workspace_admin(workspace_id))
  with check (public.is_workspace_admin(workspace_id));

-- ---------------------------------------------------------------------------
-- Stockage des avatars — public en lecture, écriture limitée au dossier de
-- l'utilisateur propriétaire (chemin attendu : avatars/<user_id>/<fichier>).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatar_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatar_owner_insert" on storage.objects
  for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatar_owner_update" on storage.objects
  for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatar_owner_delete" on storage.objects
  for delete using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- ensure_default_workspace() — création idempotente et transactionnelle du
-- premier espace de travail. Verrou consultatif par utilisateur pour empêcher
-- tout doublon en cas d'appels concurrents (deux onglets, double montage React).
-- Ne recrée jamais si un workspace actif ou une adhésion existe déjà.
-- ---------------------------------------------------------------------------
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

    v_is_new := true;
  end if;

  update public.profiles
  set active_workspace_id = v_workspace_id
  where id = auth.uid() and (active_workspace_id is distinct from v_workspace_id);

  return query select v_workspace_id, v_is_new;
end;
$$;

grant execute on function public.ensure_default_workspace() to authenticated;
