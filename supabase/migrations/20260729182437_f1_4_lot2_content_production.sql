-- F1.4 — Lot 2 : production de contenu (blocs de sujets, sujets, idées, versions,
-- étapes de workflow, vues enregistrées). Additif uniquement.
-- Ordre de création dicté par les dépendances : workflow_stages, topic_batches,
-- ideas, topics, content_versions, saved_views.
-- `ideas.publication_id` n'a pas de contrainte de clé étrangère : la table
-- `publications` n'existe pas encore (Lot 3) — même absence de contrainte que
-- côté modèle TypeScript local, où ce lien n'est pas non plus validé au moment
-- de l'écriture.

-- ---------------------------------------------------------------------------
-- workflow_stages — miroir de WorkflowStage.
-- ---------------------------------------------------------------------------
create table public.workflow_stages (
  id uuid primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  brand_id text,
  name text not null,
  description text,
  color text not null,
  "order" integer not null default 0,
  system_status text not null,
  active boolean not null default true,
  is_default boolean not null default false,
  is_terminal boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  revision integer not null default 1,
  constraint workflow_stages_scope_check check (workspace_id is not null or brand_id is not null)
);

create trigger workflow_stages_bump_revision
  before update on public.workflow_stages
  for each row execute function public.bump_revision();

create index workflow_stages_workspace_id_idx on public.workflow_stages (workspace_id);
create index workflow_stages_updated_at_idx on public.workflow_stages (updated_at);
create index workflow_stages_deleted_at_idx on public.workflow_stages (deleted_at) where deleted_at is not null;

alter table public.workflow_stages enable row level security;

create policy "workflow_stages_select_by_membership" on public.workflow_stages
  for select using (workspace_id is not null and public.is_workspace_member(workspace_id));
create policy "workflow_stages_insert_by_membership" on public.workflow_stages
  for insert with check (workspace_id is not null and public.is_workspace_member(workspace_id));
create policy "workflow_stages_update_by_membership" on public.workflow_stages
  for update using (workspace_id is not null and public.is_workspace_member(workspace_id))
  with check (workspace_id is not null and public.is_workspace_member(workspace_id));
create policy "workflow_stages_delete_by_membership" on public.workflow_stages
  for delete using (workspace_id is not null and public.is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- topic_batches — miroir de TopicBatch.
-- ---------------------------------------------------------------------------
create table public.topic_batches (
  id uuid primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brand_id text,
  theme_id uuid references public.themes(id),
  name text not null,
  requested_count integer not null default 0,
  generated_count integer not null default 0,
  selected_count integer not null default 0,
  target_audience text,
  objective text,
  platforms text[] not null default '{}',
  formats text[] not null default '{}',
  instructions text,
  variety_level text check (variety_level in ('low', 'medium', 'high')),
  status text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  revision integer not null default 1
);

create trigger topic_batches_bump_revision
  before update on public.topic_batches
  for each row execute function public.bump_revision();

create index topic_batches_workspace_id_idx on public.topic_batches (workspace_id);
create index topic_batches_updated_at_idx on public.topic_batches (updated_at);
create index topic_batches_deleted_at_idx on public.topic_batches (deleted_at) where deleted_at is not null;

alter table public.topic_batches enable row level security;

create policy "topic_batches_select_by_membership" on public.topic_batches
  for select using (public.is_workspace_member(workspace_id));
create policy "topic_batches_insert_by_membership" on public.topic_batches
  for insert with check (public.is_workspace_member(workspace_id));
create policy "topic_batches_update_by_membership" on public.topic_batches
  for update using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "topic_batches_delete_by_membership" on public.topic_batches
  for delete using (public.is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- ideas — miroir de Idea.
-- ---------------------------------------------------------------------------
create table public.ideas (
  id uuid primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brand_id text,
  theme_id uuid references public.themes(id),
  batch_id uuid references public.topic_batches(id),
  campaign_id uuid references public.campaigns(id),
  workflow_stage_id uuid references public.workflow_stages(id),
  publication_id uuid,
  active_version_id uuid,
  title text not null,
  description text,
  angle text,
  objective text,
  target_audience text,
  source text not null check (source in ('manual', 'generated')),
  priority text check (priority in ('low', 'medium', 'high')),
  platform text,
  format text,
  scheduled_for timestamptz,
  due_date timestamptz,
  owner text,
  approver text,
  quick_notes text,
  status text not null,
  hook text,
  personal_notes text,
  "references" text[] not null default '{}',
  key_points text[] not null default '{}',
  content_plan text,
  body text,
  conclusion text,
  cta text,
  hashtags text[] not null default '{}',
  first_comment text,
  media jsonb not null default '[]'::jsonb,
  internal_notes text,
  document_content jsonb,
  workshop_display_mode text check (workshop_display_mode in ('document', 'structured')),
  tone text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  revision integer not null default 1
);

create trigger ideas_bump_revision
  before update on public.ideas
  for each row execute function public.bump_revision();

create index ideas_workspace_id_idx on public.ideas (workspace_id);
create index ideas_workspace_brand_idx on public.ideas (workspace_id, brand_id);
create index ideas_updated_at_idx on public.ideas (updated_at);
create index ideas_deleted_at_idx on public.ideas (deleted_at) where deleted_at is not null;

alter table public.ideas enable row level security;

create policy "ideas_select_by_membership" on public.ideas
  for select using (public.is_workspace_member(workspace_id));
create policy "ideas_insert_by_membership" on public.ideas
  for insert with check (public.is_workspace_member(workspace_id));
create policy "ideas_update_by_membership" on public.ideas
  for update using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "ideas_delete_by_membership" on public.ideas
  for delete using (public.is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- topics — miroir de Topic.
-- ---------------------------------------------------------------------------
create table public.topics (
  id uuid primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  batch_id uuid not null references public.topic_batches(id) on delete cascade,
  label text not null,
  selected boolean not null default false,
  locked boolean not null default false,
  duplicate_of_id uuid,
  idea_id uuid references public.ideas(id),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  revision integer not null default 1
);

create trigger topics_bump_revision
  before update on public.topics
  for each row execute function public.bump_revision();

create index topics_workspace_id_idx on public.topics (workspace_id);
create index topics_batch_id_idx on public.topics (batch_id);
create index topics_updated_at_idx on public.topics (updated_at);
create index topics_deleted_at_idx on public.topics (deleted_at) where deleted_at is not null;

alter table public.topics enable row level security;

create policy "topics_select_by_membership" on public.topics
  for select using (public.is_workspace_member(workspace_id));
create policy "topics_insert_by_membership" on public.topics
  for insert with check (public.is_workspace_member(workspace_id));
create policy "topics_update_by_membership" on public.topics
  for update using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "topics_delete_by_membership" on public.topics
  for delete using (public.is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- content_versions — miroir de ContentVersion (body polymorphe selon format).
-- ---------------------------------------------------------------------------
create table public.content_versions (
  id uuid primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  idea_id uuid not null references public.ideas(id) on delete cascade,
  version_number integer not null,
  name text,
  source text not null check (source in ('manual', 'ai')),
  format text not null,
  body jsonb not null,
  instructions text,
  is_current boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  revision integer not null default 1
);

create trigger content_versions_bump_revision
  before update on public.content_versions
  for each row execute function public.bump_revision();

create index content_versions_workspace_id_idx on public.content_versions (workspace_id);
create index content_versions_idea_id_idx on public.content_versions (idea_id);
create index content_versions_updated_at_idx on public.content_versions (updated_at);
create index content_versions_deleted_at_idx on public.content_versions (deleted_at) where deleted_at is not null;

alter table public.content_versions enable row level security;

create policy "content_versions_select_by_membership" on public.content_versions
  for select using (public.is_workspace_member(workspace_id));
create policy "content_versions_insert_by_membership" on public.content_versions
  for insert with check (public.is_workspace_member(workspace_id));
create policy "content_versions_update_by_membership" on public.content_versions
  for update using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "content_versions_delete_by_membership" on public.content_versions
  for delete using (public.is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- saved_views — miroir de SavedView.
-- ---------------------------------------------------------------------------
create table public.saved_views (
  id uuid primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brand_id text,
  name text not null,
  description text,
  view_type text not null check (view_type in ('table', 'calendar', 'kanban')),
  group_by text,
  filters jsonb not null default '[]'::jsonb,
  sorting jsonb not null default '[]'::jsonb,
  visible_properties text[] not null default '{}',
  hidden_groups text[] not null default '{}',
  is_default boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  revision integer not null default 1
);

create trigger saved_views_bump_revision
  before update on public.saved_views
  for each row execute function public.bump_revision();

create index saved_views_workspace_id_idx on public.saved_views (workspace_id);
create index saved_views_updated_at_idx on public.saved_views (updated_at);
create index saved_views_deleted_at_idx on public.saved_views (deleted_at) where deleted_at is not null;

alter table public.saved_views enable row level security;

create policy "saved_views_select_by_membership" on public.saved_views
  for select using (public.is_workspace_member(workspace_id));
create policy "saved_views_insert_by_membership" on public.saved_views
  for insert with check (public.is_workspace_member(workspace_id));
create policy "saved_views_update_by_membership" on public.saved_views
  for update using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "saved_views_delete_by_membership" on public.saved_views
  for delete using (public.is_workspace_member(workspace_id));
