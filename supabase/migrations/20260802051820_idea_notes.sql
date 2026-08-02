-- ---------------------------------------------------------------------------
-- idea_notes — miroir de IdeaNote (nouvelle vue « Notes » de la Banque d'idées).
-- Extension strictement additive : aucune table existante modifiée, aucune donnée
-- existante touchée. Une note est une entité indépendante de ideas — jamais lue par
-- les vues Cartes/Tableau/Kanban existantes, jusqu'à conversion explicite en idée.
-- ---------------------------------------------------------------------------

create table public.idea_notes (
  id uuid primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brand_id text,
  standalone_niche text,
  theme_id uuid references public.themes(id),
  adhoc_theme_label text,
  title text not null default '',
  content jsonb not null,
  body_text text not null default '',
  content_type text,
  format text,
  objective text,
  platform text,
  status text,
  priority text check (priority in ('low', 'medium', 'high')),
  owner text,
  -- Idée déjà créée à partir de cette note (« Convertir en idée » / « Développer dans la
  -- production ») — anti-doublon sur double clic, jamais un lien de suppression en cascade :
  -- la note reste indépendante même si l'idée liée est ensuite supprimée.
  converted_idea_id uuid references public.ideas(id) on delete set null,
  archive_status text not null default 'active' check (archive_status in ('active', 'archived')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  revision integer not null default 1
);

create trigger idea_notes_bump_revision
  before update on public.idea_notes
  for each row execute function public.bump_revision();

create index idea_notes_workspace_id_idx on public.idea_notes (workspace_id);
create index idea_notes_workspace_brand_idx on public.idea_notes (workspace_id, brand_id);
create index idea_notes_updated_at_idx on public.idea_notes (updated_at);
create index idea_notes_deleted_at_idx on public.idea_notes (deleted_at) where deleted_at is not null;

alter table public.idea_notes enable row level security;

-- RLS uniforme, identique au reste du schéma (ideas, topics, important_dates, campaigns...) :
-- tout membre actif du workspace peut lire/créer/modifier/supprimer — jamais un autre
-- workspace, jamais de restriction au seul créateur. La distinction Owner/Admin (peuvent
-- archiver et supprimer) vs Member (crée et modifie) est une décision produit appliquée côté
-- application (comme pour ImportantDatesPanel/BrandThemesSection), pas un nouveau précédent de
-- RLS différenciée par rôle sur une table de contenu. created_by est conservé pour la
-- traçabilité uniquement, jamais utilisé pour restreindre l'accès.
create policy "idea_notes_select_by_membership" on public.idea_notes
  for select using (public.is_workspace_member(workspace_id));
create policy "idea_notes_insert_by_membership" on public.idea_notes
  for insert with check (public.is_workspace_member(workspace_id));
create policy "idea_notes_update_by_membership" on public.idea_notes
  for update using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "idea_notes_delete_by_membership" on public.idea_notes
  for delete using (public.is_workspace_member(workspace_id));
