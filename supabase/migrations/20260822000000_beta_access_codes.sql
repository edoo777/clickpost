-- Nouvelle structure tarifaire (Créateur / Créateur Pro / Agence / Agence Pro) + système de codes
-- bêta temporaires (accès Agence pour les testeurs, sans jamais toucher aux vrais abonnements
-- Stripe futurs). Additif et idempotent : aucune ligne existante supprimée, aucune contrainte de
-- clé étrangère cassée pour un workspace déjà abonné à un ancien plan.

-- ---------------------------------------------------------------------------------------
-- 1. Plans réels — nouvelle structure. Les anciennes clés 'starter'/'pro' sont désactivées
--    (active=false) plutôt que supprimées : un workspace existant qui y référerait encore garde
--    une ligne valide (contrainte de clé étrangère sur workspace_subscriptions.plan_key), il
--    n'est simplement plus proposé à la souscription. 'free' reste inchangé (repli par défaut de
--    ensure_default_subscription, voir la migration originale).
-- ---------------------------------------------------------------------------------------
update public.plans set active = false where key in ('starter', 'pro');

insert into public.plans (key, name, description, price_usd_cents, ai_generation_quota_monthly, max_brands, max_social_accounts, max_workspace_members, features, is_default, active, sort_order)
values
  ('creator', 'Créateur', 'Pour démarrer une présence de contenu régulière, seul.', 1900, 50, 1, 3, 1,
    '{"analyticsAdvanced": false, "trends": false, "reportsPdf": false, "reportsAdvanced": false, "approvalWorkflow": false, "clientSpaces": false, "whiteLabelReports": false, "prioritySupport": false}'::jsonb,
    false, true, 1)
  on conflict (key) do update set
    name = excluded.name, description = excluded.description, price_usd_cents = excluded.price_usd_cents,
    ai_generation_quota_monthly = excluded.ai_generation_quota_monthly, max_brands = excluded.max_brands,
    max_social_accounts = excluded.max_social_accounts, max_workspace_members = excluded.max_workspace_members,
    features = excluded.features, active = true, sort_order = excluded.sort_order;

insert into public.plans (key, name, description, price_usd_cents, ai_generation_quota_monthly, max_brands, max_social_accounts, max_workspace_members, features, is_default, active, sort_order)
values
  ('creator_pro', 'Créateur Pro', 'Pour un créateur actif qui veut l''IA complète et les tendances.', 3900, 250, 3, 8, 3,
    '{"analyticsAdvanced": true, "trends": true, "reportsPdf": true, "reportsAdvanced": false, "approvalWorkflow": false, "clientSpaces": false, "whiteLabelReports": false, "prioritySupport": false}'::jsonb,
    false, true, 2)
  on conflict (key) do update set
    name = excluded.name, description = excluded.description, price_usd_cents = excluded.price_usd_cents,
    ai_generation_quota_monthly = excluded.ai_generation_quota_monthly, max_brands = excluded.max_brands,
    max_social_accounts = excluded.max_social_accounts, max_workspace_members = excluded.max_workspace_members,
    features = excluded.features, active = true, sort_order = excluded.sort_order;

-- 'agency' existe déjà (voir la migration originale) — mise à jour de ses valeurs plutôt qu'un
-- second insert, pour ne jamais dupliquer la clé primaire.
update public.plans set
  name = 'Agence',
  description = 'Pour une équipe ou une agence gérant plusieurs marques et clients.',
  price_usd_cents = 9900,
  ai_generation_quota_monthly = 750,
  max_brands = 10,
  max_social_accounts = 25,
  max_workspace_members = 5,
  features = '{"analyticsAdvanced": true, "trends": true, "reportsPdf": true, "reportsAdvanced": true, "approvalWorkflow": true, "clientSpaces": true, "whiteLabelReports": false, "prioritySupport": true}'::jsonb,
  active = true,
  sort_order = 3
where key = 'agency';

insert into public.plans (key, name, description, price_usd_cents, ai_generation_quota_monthly, max_brands, max_social_accounts, max_workspace_members, features, is_default, active, sort_order)
values
  ('agency_pro', 'Agence Pro', 'Usage étendu, rapports white-label, support prioritaire.', 19900, 2000, 30, 75, 15,
    '{"analyticsAdvanced": true, "trends": true, "reportsPdf": true, "reportsAdvanced": true, "approvalWorkflow": true, "clientSpaces": true, "whiteLabelReports": true, "prioritySupport": true}'::jsonb,
    false, true, 4)
  on conflict (key) do update set
    name = excluded.name, description = excluded.description, price_usd_cents = excluded.price_usd_cents,
    ai_generation_quota_monthly = excluded.ai_generation_quota_monthly, max_brands = excluded.max_brands,
    max_social_accounts = excluded.max_social_accounts, max_workspace_members = excluded.max_workspace_members,
    features = excluded.features, active = true, sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------------------
-- 2. beta_codes — codes d'accès temporaire, gérés uniquement par service_role (Admin ClickPost).
--    Aucune politique RLS accordée à `anon`/`authenticated` : ni la liste des codes, ni leur
--    existence ne doivent être lisibles depuis le client — la vérification d'un code saisi par un
--    utilisateur se fait exclusivement côté serveur (voir src/lib/billing/beta-codes.ts).
-- ---------------------------------------------------------------------------------------
create table public.beta_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  plan_key text not null references public.plans(key),
  grant_duration_days integer not null default 30,
  max_uses integer,
  used_count integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

alter table public.beta_codes enable row level security;
-- Aucune politique créée intentionnellement — service_role uniquement, voir le commentaire ci-dessus.

-- ---------------------------------------------------------------------------------------
-- 3. Superposition d'accès bêta sur workspace_subscriptions — jamais un remplacement du plan réel
--    (`plan_key`/`status` restent la source de vérité Stripe, intacte). L'accès effectif est
--    résolu à la lecture (voir getWorkspacePlanContext) : si `beta_expires_at` est dans le futur,
--    le plan bêta prévaut sur `plan_key` pour cette lecture uniquement — jamais écrit dans
--    `plan_key` lui-même. Une fois expiré, aucune action de "retour en arrière" n'est nécessaire :
--    la résolution ignore simplement une date passée.
-- ---------------------------------------------------------------------------------------
alter table public.workspace_subscriptions
  add column if not exists beta_plan_key text references public.plans(key),
  add column if not exists beta_expires_at timestamptz,
  add column if not exists beta_code_id uuid references public.beta_codes(id);

-- Code de développement initial pour les bêta-testeurs — désactivable/remplaçable depuis
-- /admin/beta sans nouvelle migration. `on conflict do nothing` : ne réinitialise jamais un code
-- déjà modifié manuellement (ex. désactivé) si cette migration est rejouée.
insert into public.beta_codes (code, plan_key, grant_duration_days, active)
values ('CLICKPOST-BETA-AGENCY', 'agency', 30, true)
on conflict (code) do nothing;
