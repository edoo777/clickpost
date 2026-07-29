-- F1.1 — Fondations Supabase
-- Portée : profils utilisateur (données personnelles), workspaces et appartenance
-- (données de workspace). Les tables métier (marques, idées, publications, etc.)
-- arrivent en F1.4 — ne pas les ajouter ici.

-- Fonction utilitaire : maintien automatique de updated_at sur chaque UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles — données personnelles, 1-1 avec auth.users, jamais partagées.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  company text not null default '',
  time_zone text not null default '',
  language text not null default '',
  country text not null default '',
  phone text not null default '',
  bio text not null default '',
  notifications jsonb not null default '{}'::jsonb,
  display_density text not null default 'comfortable'
    check (display_density in ('comfortable', 'compact')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());

create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid());

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- Création automatique d'un profil vide à l'inscription (branché en F1.2/F1.3).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- workspaces — espace de travail partagé (frontière de la RLS pour F1.4+).
-- ---------------------------------------------------------------------------
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger workspaces_set_updated_at
  before update on public.workspaces
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- workspace_members — appartenance + rôle (reflète TeamMember.role côté app).
-- ---------------------------------------------------------------------------
create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner'
    check (role in ('owner', 'admin', 'manager', 'creator', 'reviewer', 'client_approver')),
  brand_ids uuid[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'inactive')),
  joined_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

-- Fonctions RLS (security definer : évite la récursion des policies sur
-- workspace_members en interrogeant la table hors RLS).
create or replace function public.is_workspace_member(ws_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id and user_id = auth.uid() and status = 'active'
  );
$$;

create or replace function public.is_workspace_admin(ws_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id and user_id = auth.uid()
      and status = 'active' and role in ('owner', 'admin')
  );
$$;

create policy "workspaces_select_by_membership" on public.workspaces
  for select using (public.is_workspace_member(id));

create policy "workspaces_insert_by_creator" on public.workspaces
  for insert with check (created_by = auth.uid());

create policy "workspaces_update_by_admin" on public.workspaces
  for update using (public.is_workspace_admin(id));

create policy "workspace_members_select_by_membership" on public.workspace_members
  for select using (public.is_workspace_member(workspace_id));

-- Permet au créateur d'un workspace de s'y insérer lui-même comme premier membre
-- (owner), avant qu'aucune ligne d'appartenance n'existe encore.
create policy "workspace_members_insert_self_as_creator" on public.workspace_members
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.workspaces w
      where w.id = workspace_id and w.created_by = auth.uid()
    )
  );

create policy "workspace_members_insert_by_admin" on public.workspace_members
  for insert with check (public.is_workspace_admin(workspace_id));

create policy "workspace_members_update_by_admin" on public.workspace_members
  for update using (public.is_workspace_admin(workspace_id));

create policy "workspace_members_delete_by_admin" on public.workspace_members
  for delete using (public.is_workspace_admin(workspace_id));
