-- F1.4 — Lot 1 : structure commerciale (comptes sociaux, campagnes, thématiques)
-- Additif uniquement : ne modifie aucune table/politique des migrations précédentes.
-- Pas de table `brands` ici (voir échange F1.4) : brand_id/brand restent en `text`
-- (slug ou nom local actuel), en attendant un vrai magasin de marques (F1.5).

-- Trigger générique de contrôle de concurrence optimiste, réutilisé par toutes les
-- tables synchronisées de F1.4 : incrémente `revision` et met à jour `updated_at`
-- à chaque UPDATE. Un push client dont la `revision` attendue ne correspond plus
-- à la valeur en base ne touche aucune ligne — c'est ainsi que le conflit est
-- détecté côté application (0 ligne affectée = quelqu'un d'autre a modifié entre-temps).
create or replace function public.bump_revision()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  new.revision = old.revision + 1;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- accounts — comptes sociaux connectés (miroir de SocialAccount).
-- ---------------------------------------------------------------------------
create table public.accounts (
  id uuid primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brand text,
  platform text not null check (platform in ('instagram', 'facebook', 'linkedin', 'tiktok', 'x', 'youtube')),
  account_name text not null,
  handle text not null,
  status text not null check (status in ('connected', 'disconnected', 'expired', 'error', 'syncing')),
  last_synced_at timestamptz,
  permissions text[] not null default '{}',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  revision integer not null default 1
);

create trigger accounts_bump_revision
  before update on public.accounts
  for each row execute function public.bump_revision();

create index accounts_workspace_id_idx on public.accounts (workspace_id);
create index accounts_updated_at_idx on public.accounts (updated_at);
create index accounts_deleted_at_idx on public.accounts (deleted_at) where deleted_at is not null;

alter table public.accounts enable row level security;

create policy "accounts_select_by_membership" on public.accounts
  for select using (public.is_workspace_member(workspace_id));
create policy "accounts_insert_by_membership" on public.accounts
  for insert with check (public.is_workspace_member(workspace_id));
create policy "accounts_update_by_membership" on public.accounts
  for update using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "accounts_delete_by_membership" on public.accounts
  for delete using (public.is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- campaigns — miroir de Campaign.
-- ---------------------------------------------------------------------------
create table public.campaigns (
  id uuid primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brand_id text,
  name text not null,
  objective text,
  start_date date,
  end_date date,
  active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  revision integer not null default 1
);

create trigger campaigns_bump_revision
  before update on public.campaigns
  for each row execute function public.bump_revision();

create index campaigns_workspace_id_idx on public.campaigns (workspace_id);
create index campaigns_workspace_brand_idx on public.campaigns (workspace_id, brand_id);
create index campaigns_updated_at_idx on public.campaigns (updated_at);
create index campaigns_deleted_at_idx on public.campaigns (deleted_at) where deleted_at is not null;

alter table public.campaigns enable row level security;

create policy "campaigns_select_by_membership" on public.campaigns
  for select using (public.is_workspace_member(workspace_id));
create policy "campaigns_insert_by_membership" on public.campaigns
  for insert with check (public.is_workspace_member(workspace_id));
create policy "campaigns_update_by_membership" on public.campaigns
  for update using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "campaigns_delete_by_membership" on public.campaigns
  for delete using (public.is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- themes — miroir de Theme (rattaché au Lot 1 : référencé par topic_batches/ideas du Lot 2).
-- ---------------------------------------------------------------------------
create table public.themes (
  id uuid primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brand_id text,
  label text not null,
  objective text,
  weekdays text[] not null default '{}',
  "order" integer not null default 0,
  active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  revision integer not null default 1
);

create trigger themes_bump_revision
  before update on public.themes
  for each row execute function public.bump_revision();

create index themes_workspace_id_idx on public.themes (workspace_id);
create index themes_workspace_brand_idx on public.themes (workspace_id, brand_id);
create index themes_updated_at_idx on public.themes (updated_at);
create index themes_deleted_at_idx on public.themes (deleted_at) where deleted_at is not null;

alter table public.themes enable row level security;

create policy "themes_select_by_membership" on public.themes
  for select using (public.is_workspace_member(workspace_id));
create policy "themes_insert_by_membership" on public.themes
  for insert with check (public.is_workspace_member(workspace_id));
create policy "themes_update_by_membership" on public.themes
  for update using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "themes_delete_by_membership" on public.themes
  for delete using (public.is_workspace_member(workspace_id));

revoke execute on function public.bump_revision() from anon;
