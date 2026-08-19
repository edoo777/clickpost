-- Fondations analytics produit + facturation (préparation bêta). Extension strictement
-- additive : aucune table existante modifiée. Trois familles de tables :
--
-- 1. `product_events` — funnel produit (signup → activation → rétention), jamais de donnée
--    financière fabriquée : uniquement des événements réellement émis par l'application au fil
--    de l'usage réel. Sert de source au tableau de bord Admin (DAU/WAU/MAU, funnel).
-- 2. `ai_usage_events` — une ligne par appel Claude réellement effectué (jamais estimé a priori),
--    avec tokens réels renvoyés par l'API Anthropic. Sert à la fois au contrôle de quota (protéger
--    la marge) et au calcul du coût IA affiché dans l'Admin.
-- 3. `plans` / `workspace_subscriptions` — configuration des offres ClickPost et abonnement par
--    workspace. Sans intégration Stripe réelle (clé absente), tous les workspaces existants et
--    nouveaux sont rattachés au plan gratuit par défaut avec un statut "none" (aucun abonnement
--    payant réel) — jamais un statut "active" fabriqué. Les colonnes stripe_* restent vides tant
--    qu'aucun paiement réel n'a eu lieu ; prêtes à être renseignées par un futur webhook Stripe.

-- ---------------------------------------------------------------------------
-- 1. product_events
-- ---------------------------------------------------------------------------
create table public.product_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  user_id uuid references auth.users(id),
  workspace_id uuid references public.workspaces(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index product_events_name_created_idx on public.product_events (event_name, created_at);
create index product_events_user_idx on public.product_events (user_id, created_at);
create index product_events_workspace_idx on public.product_events (workspace_id, created_at);

alter table public.product_events enable row level security;

-- Écriture : un utilisateur authentifié ne peut journaliser qu'un événement le concernant
-- lui-même (jamais au nom d'un autre utilisateur). Aucune politique de lecture cliente — ce sont
-- des données d'usage agrégées pour l'Admin uniquement, lu via service_role (voir
-- src/lib/admin/analytics.ts), jamais exposées à un workspace normal.
create policy "product_events_insert_own" on public.product_events
  for insert with check (auth.uid() is not null and user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 2. ai_usage_events
-- ---------------------------------------------------------------------------
create table public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  feature_key text not null,
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  estimated_cost_usd numeric(10, 6) not null default 0,
  created_at timestamptz not null default now()
);

create index ai_usage_events_workspace_created_idx on public.ai_usage_events (workspace_id, created_at);
create index ai_usage_events_feature_idx on public.ai_usage_events (feature_key, created_at);

alter table public.ai_usage_events enable row level security;

-- Écriture : un membre actif du workspace peut journaliser un usage IA en son propre nom,
-- immédiatement après un appel Claude réel (jamais avant, jamais un usage estimé/simulé).
create policy "ai_usage_events_insert_by_membership" on public.ai_usage_events
  for insert with check (public.is_workspace_member(workspace_id) and user_id = auth.uid());

-- Lecture : les membres d'un workspace peuvent voir leur propre consommation (utile pour un futur
-- affichage de quota côté client) ; le détail coût agrégé plateforme reste réservé à l'Admin via
-- service_role.
create policy "ai_usage_events_select_by_membership" on public.ai_usage_events
  for select using (public.is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- 3. plans
-- ---------------------------------------------------------------------------
create table public.plans (
  key text primary key,
  name text not null,
  description text not null default '',
  price_usd_cents integer,
  ai_generation_quota_monthly integer,
  max_brands integer,
  max_social_accounts integer,
  max_workspace_members integer,
  features jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.plans enable row level security;

-- Lecture publique : l'application doit pouvoir afficher les limites/fonctionnalités du plan
-- courant sans être Admin. Écriture réservée à service_role (routes /api/admin/** futures),
-- aucune politique d'écriture cliente.
create policy "plans_select_all" on public.plans
  for select using (true);

-- Valeurs de départ honnêtes et volontairement modestes — une configuration de référence prête à
-- être ajustée depuis l'Admin, PAS une décision de tarification définitive. `price_usd_cents`
-- reste NULL tant qu'aucune décision commerciale réelle n'a été prise.
insert into public.plans (key, name, description, price_usd_cents, ai_generation_quota_monthly, max_brands, max_social_accounts, max_workspace_members, features, is_default, sort_order) values
  ('free', 'Gratuit', 'Plan de démarrage — usage limité, sans engagement.', 0, 20, 1, 2, 1,
    '{"reports": false, "gammaExport": false}'::jsonb, true, 0),
  ('starter', 'Starter', 'Pour un créateur ou une petite marque active.', null, 150, 3, 6, 3,
    '{"reports": true, "gammaExport": false}'::jsonb, false, 1),
  ('pro', 'Pro', 'Pour une équipe ou une agence gérant plusieurs marques.', null, 600, 10, 20, 10,
    '{"reports": true, "gammaExport": true}'::jsonb, false, 2),
  ('agency', 'Agence', 'Usage étendu, quotas élevés, support prioritaire.', null, null, null, null, null,
    '{"reports": true, "gammaExport": true}'::jsonb, false, 3);

-- ---------------------------------------------------------------------------
-- 4. workspace_subscriptions
-- ---------------------------------------------------------------------------
create table public.workspace_subscriptions (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  plan_key text not null references public.plans(key) default 'free',
  -- "none" = aucun abonnement payant réel (état honnête par défaut, aucune intégration Stripe
  -- connectée). Jamais "active" sans confirmation Stripe réelle (webhook futur).
  status text not null default 'none' check (status in ('none', 'trialing', 'active', 'past_due', 'canceled')),
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workspace_subscriptions_plan_idx on public.workspace_subscriptions (plan_key);
create index workspace_subscriptions_status_idx on public.workspace_subscriptions (status);

alter table public.workspace_subscriptions enable row level security;

create policy "workspace_subscriptions_select_by_membership" on public.workspace_subscriptions
  for select using (public.is_workspace_member(workspace_id));

-- Aucune politique d'écriture cliente : les changements de plan passeront exclusivement par un
-- futur webhook Stripe (service_role) ou une route Admin explicite — jamais un membre de
-- workspace ne peut s'auto-attribuer un plan payant.

create trigger workspace_subscriptions_bump_updated_at
  before update on public.workspace_subscriptions
  for each row execute function public.bump_revision();

-- Rattache automatiquement chaque nouveau workspace au plan gratuit — sans intervention
-- applicative, pour qu'aucun workspace ne se retrouve jamais sans ligne d'abonnement (état
-- indéfini). `on conflict do nothing` rend l'opération idempotente si rejouée.
create or replace function public.ensure_default_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspace_subscriptions (workspace_id, plan_key, status)
  values (new.id, 'free', 'none')
  on conflict (workspace_id) do nothing;
  return new;
end;
$$;

create trigger workspaces_ensure_default_subscription
  after insert on public.workspaces
  for each row execute function public.ensure_default_subscription();

-- Rattrapage pour les workspaces déjà existants avant cette migration.
insert into public.workspace_subscriptions (workspace_id, plan_key, status)
select id, 'free', 'none' from public.workspaces
on conflict (workspace_id) do nothing;

-- `bump_revision()` attend une colonne `revision` sur la ligne modifiée (voir migration F1.4) ;
-- workspace_subscriptions n'en a pas, on utilise donc un trigger dédié minimal à la place.
drop trigger if exists workspace_subscriptions_bump_updated_at on public.workspace_subscriptions;

create or replace function public.bump_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger workspace_subscriptions_bump_updated_at
  before update on public.workspace_subscriptions
  for each row execute function public.bump_updated_at();
