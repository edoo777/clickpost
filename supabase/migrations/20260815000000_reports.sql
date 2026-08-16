-- reports — historique des rapports générés par le module Rapports (F-Rapports, MVP).
-- Extension strictement additive : aucune table existante modifiée, aucune donnée existante
-- touchée. Les KPI/l'analyse Claude sont calculés côté client (à partir des données déjà
-- synchronisées — voir src/lib/reports/build-report-data.ts) et envoyés ici uniquement au moment
-- où l'utilisateur enregistre/génère un rapport ; cette table n'est jamais la source de calcul,
-- seulement l'historique persistant. gamma_generation_id/stored_file_url restent vides tant que
-- l'export PDF Gamma n'a pas été déclenché (fonctionnalité désactivée sans GAMMA_API_KEY).

create table public.reports (
  id uuid primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  report_type text not null check (report_type in ('internal', 'client')),
  period_start date not null,
  period_end date not null,
  platform text not null default 'all',
  status text not null default 'ready' check (status in ('draft', 'ready', 'generating_pdf', 'pdf_ready', 'pdf_failed')),
  summary text,
  ai_analysis jsonb,
  gamma_generation_id text,
  stored_file_url text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  revision integer not null default 1
);

create trigger reports_bump_revision
  before update on public.reports
  for each row execute function public.bump_revision();

create index reports_workspace_id_idx on public.reports (workspace_id);
create index reports_workspace_brand_idx on public.reports (workspace_id, brand_id);
create index reports_updated_at_idx on public.reports (updated_at);
create index reports_deleted_at_idx on public.reports (deleted_at) where deleted_at is not null;

alter table public.reports enable row level security;

-- RLS uniforme, identique au reste du schéma (saved_trends, idea_notes, important_dates...) :
-- tout membre actif du workspace peut lire/créer/modifier/supprimer — jamais un autre workspace.
create policy "reports_select_by_membership" on public.reports
  for select using (public.is_workspace_member(workspace_id));
create policy "reports_insert_by_membership" on public.reports
  for insert with check (public.is_workspace_member(workspace_id));
create policy "reports_update_by_membership" on public.reports
  for update using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "reports_delete_by_membership" on public.reports
  for delete using (public.is_workspace_member(workspace_id));
