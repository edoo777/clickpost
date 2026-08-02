-- saved_trends — seule entité de tendance persistée (fonctionnalité « Tendances », MVP).
-- Extension strictement additive : aucune table existante modifiée, aucune donnée existante
-- touchée. Les tendances/actualités elles-mêmes (TrendItem/PlatformNewsItem) ne sont JAMAIS
-- écrites ici : elles restent en cache serveur uniquement (voir src/lib/trends/cache.ts). Seule
-- une action explicite de l'utilisateur (Enregistrer / Masquer / Non pertinente) crée une ligne.

create table public.saved_trends (
  id uuid primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brand_id text,
  provider text not null,
  external_id text,
  title text not null,
  source_url text not null,
  notes text,
  status text not null default 'saved' check (status in ('saved', 'hidden', 'not_relevant')),
  saved_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  revision integer not null default 1
);

create trigger saved_trends_bump_revision
  before update on public.saved_trends
  for each row execute function public.bump_revision();

create index saved_trends_workspace_id_idx on public.saved_trends (workspace_id);
create index saved_trends_workspace_brand_idx on public.saved_trends (workspace_id, brand_id);
create index saved_trends_provider_external_idx on public.saved_trends (provider, external_id);
create index saved_trends_updated_at_idx on public.saved_trends (updated_at);
create index saved_trends_deleted_at_idx on public.saved_trends (deleted_at) where deleted_at is not null;

alter table public.saved_trends enable row level security;

-- RLS uniforme, identique au reste du schéma (idea_notes, important_dates, campaigns...) : tout
-- membre actif du workspace peut lire/créer/modifier/supprimer — jamais un autre workspace,
-- jamais de restriction au seul créateur. saved_by est conservé pour la traçabilité uniquement.
create policy "saved_trends_select_by_membership" on public.saved_trends
  for select using (public.is_workspace_member(workspace_id));
create policy "saved_trends_insert_by_membership" on public.saved_trends
  for insert with check (public.is_workspace_member(workspace_id));
create policy "saved_trends_update_by_membership" on public.saved_trends
  for update using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "saved_trends_delete_by_membership" on public.saved_trends
  for delete using (public.is_workspace_member(workspace_id));
