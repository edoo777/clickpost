-- Panneau « Dates importantes » de /calendrier — nouvelle entité synchronisée, sur le même
-- patron que campaigns/themes. Aucune donnée de démonstration insérée par cette migration.

create table public.important_dates (
  id uuid primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  category text not null check (category in ('holiday', 'annual_event', 'organization', 'brand_campaign')),
  title text not null,
  description text,
  start_date date not null,
  end_date date,
  country text,
  region text,
  brand_id text,
  source text not null default 'manual' check (source in ('manual', 'external')),
  external_id text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  revision integer not null default 1
);

create trigger important_dates_bump_revision
  before update on public.important_dates
  for each row execute function public.bump_revision();

create index important_dates_workspace_id_idx on public.important_dates (workspace_id);
create index important_dates_workspace_category_idx on public.important_dates (workspace_id, category);
create index important_dates_updated_at_idx on public.important_dates (updated_at);
create index important_dates_deleted_at_idx on public.important_dates (deleted_at) where deleted_at is not null;

alter table public.important_dates enable row level security;

-- Grain membership (comme themes/accounts) : tout membre actif du workspace peut consulter et
-- gérer ces dates. L'interface restreint elle-même création/modification/archivage aux rôles
-- Propriétaire/Administrateur (canManageBrands), même double verrouillage que pour les comptes
-- affiliés et les thématiques de la fiche de marque.
create policy "important_dates_select_by_membership" on public.important_dates
  for select using (public.is_workspace_member(workspace_id));
create policy "important_dates_insert_by_membership" on public.important_dates
  for insert with check (public.is_workspace_member(workspace_id));
create policy "important_dates_update_by_membership" on public.important_dates
  for update using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "important_dates_delete_by_membership" on public.important_dates
  for delete using (public.is_workspace_member(workspace_id));
