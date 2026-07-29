-- F1.5 — Gestion réelle des marques.
-- Additif uniquement : ne modifie aucune table/politique des migrations précédentes.
-- Écriture (insert/update/delete) restreinte aux admins/owners du workspace ; lecture
-- ouverte à tout membre actif — seule table de workspace à ce jour avec ce grain
-- (les autres tables F1.4 permettent l'écriture à tout membre).

create table public.brands (
  id uuid primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  industry text,
  description text,
  products_and_services text[] not null default '{}',
  target_audience text,
  communication_goals text[] not null default '{}',
  tone_of_voice text,
  languages text[] not null default '{}',
  priority_topics text[] not null default '{}',
  topics_to_avoid text[] not null default '{}',
  preferred_phrases text[] not null default '{}',
  forbidden_words text[] not null default '{}',
  preferred_ctas text[] not null default '{}',
  social_platforms text[] not null default '{}',
  logo_url text,
  website text,
  time_zone text,
  color_primary text,
  color_secondary text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  revision integer not null default 1
);

create trigger brands_bump_revision
  before update on public.brands
  for each row execute function public.bump_revision();

create index brands_workspace_id_idx on public.brands (workspace_id);
create index brands_updated_at_idx on public.brands (updated_at);
create index brands_deleted_at_idx on public.brands (deleted_at) where deleted_at is not null;
create index brands_status_idx on public.brands (workspace_id, status);

alter table public.brands enable row level security;

create policy "brands_select_by_membership" on public.brands
  for select using (public.is_workspace_member(workspace_id));
create policy "brands_insert_by_admin" on public.brands
  for insert with check (public.is_workspace_admin(workspace_id));
create policy "brands_update_by_admin" on public.brands
  for update using (public.is_workspace_admin(workspace_id)) with check (public.is_workspace_admin(workspace_id));
create policy "brands_delete_by_admin" on public.brands
  for delete using (public.is_workspace_admin(workspace_id));
