-- F1.4 — Lot 3 : publications (miroir de Publication). Additif uniquement.
-- Referme la boucle idée ↔ publication : ajoute maintenant la contrainte de clé
-- étrangère sur ideas.publication_id, laissée sans contrainte au Lot 2 puisque
-- cette table n'existait pas encore.

create table public.publications (
  id uuid primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brand text,
  account_id uuid references public.accounts(id),
  platform text not null check (platform in ('instagram', 'facebook', 'linkedin', 'tiktok', 'x', 'youtube')),
  scheduled_for timestamptz not null,
  time_zone text not null,
  theme text,
  theme_id uuid references public.themes(id),
  format text not null,
  objective text,
  angle text,
  excerpt text,
  text text,
  cta text,
  hashtags text[] not null default '{}',
  first_comment text,
  media jsonb not null default '[]'::jsonb,
  status text not null,
  priority text check (priority in ('low', 'medium', 'high')),
  due_date timestamptz,
  owner text,
  approver text,
  campaign_id uuid references public.campaigns(id),
  internal_notes text,
  comments jsonb not null default '[]'::jsonb,
  history jsonb not null default '[]'::jsonb,
  source text check (source in ('manual', 'generated')),
  linked_publication_id uuid,
  idea_id uuid references public.ideas(id),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  revision integer not null default 1
);

create trigger publications_bump_revision
  before update on public.publications
  for each row execute function public.bump_revision();

create index publications_workspace_id_idx on public.publications (workspace_id);
create index publications_workspace_brand_idx on public.publications (workspace_id, brand);
create index publications_updated_at_idx on public.publications (updated_at);
create index publications_deleted_at_idx on public.publications (deleted_at) where deleted_at is not null;
create index publications_scheduled_for_idx on public.publications (scheduled_for);

alter table public.publications enable row level security;

create policy "publications_select_by_membership" on public.publications
  for select using (public.is_workspace_member(workspace_id));
create policy "publications_insert_by_membership" on public.publications
  for insert with check (public.is_workspace_member(workspace_id));
create policy "publications_update_by_membership" on public.publications
  for update using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "publications_delete_by_membership" on public.publications
  for delete using (public.is_workspace_member(workspace_id));

alter table public.ideas
  add constraint ideas_publication_id_fkey foreign key (publication_id) references public.publications(id);

create index ideas_publication_id_idx on public.ideas (publication_id);
