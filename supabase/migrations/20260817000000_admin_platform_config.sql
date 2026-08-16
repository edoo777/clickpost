-- Espace Admin MVP (F-Admin) — configuration de plateforme, jamais un workspace : ces tables ne
-- sont rattachées à aucun workspace_id, elles s'appliquent à toute l'instance ClickPost. Aucun
-- utilisateur normal ne peut y écrire (voir RLS ci-dessous) ; l'accès en écriture passe
-- exclusivement par les routes /api/admin/* protégées par ADMIN_EMAILS côté serveur (jamais un
-- rôle stocké en base — voir src/lib/admin/is-platform-admin.ts). Extension strictement
-- additive : aucune table existante modifiée.

-- Compléments de prompt IA modifiables par l'admin — jamais un remplacement des règles de
-- sécurité codées en dur (anti-hallucination, format JSON strict...), toujours un texte
-- additionnel ajouté au prompt système existant. Une seule marche arrière (previous_*) : pas
-- d'historique complet, volontairement simple pour le MVP.
create table public.prompt_overrides (
  key text primary key,
  extra_instructions text not null default '',
  previous_extra_instructions text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.prompt_overrides enable row level security;
-- Lecture : tout utilisateur authentifié (nécessaire pour que les routes IA, exécutées avec la
-- session de l'utilisateur appelant, puissent lire le complément à injecter dans le prompt).
create policy "prompt_overrides_select_authenticated" on public.prompt_overrides
  for select using (auth.uid() is not null);
-- Aucune politique d'écriture cliente : les routes /api/admin/* écrivent via service_role après
-- avoir vérifié ADMIN_EMAILS, jamais via une politique RLS.

-- Textes produit modifiables par l'admin (onboarding, messages système...) — volontairement un
-- petit ensemble curé, pas une administration exhaustive de chaque chaîne de l'application.
create table public.product_texts (
  key text primary key,
  value text not null,
  previous_value text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.product_texts enable row level security;
-- Lecture publique : ce sont de simples textes d'interface, jamais une donnée sensible, et
-- certains (page publique) doivent rester lisibles sans session (visiteur non connecté).
create policy "product_texts_select_all" on public.product_texts
  for select using (true);

-- Interrupteurs simples pour fonctionnalités en préparation — lecture publique (l'app doit
-- pouvoir savoir si une fonctionnalité est activée sans être admin), écriture réservée à
-- service_role via /api/admin/*.
create table public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  description text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.feature_flags enable row level security;
create policy "feature_flags_select_all" on public.feature_flags
  for select using (true);

-- Valeurs de départ honnêtes : rien n'est activé par défaut, aucune fonctionnalité non construite
-- n'est présentée comme disponible.
insert into public.feature_flags (key, enabled, description) values
  ('gamma_pdf_export', false, 'Export PDF des rapports via Gamma (nécessite aussi GAMMA_API_KEY côté serveur).'),
  ('instagram_integration', false, 'Intégration Instagram — non développée, réservé pour activation future.'),
  ('facebook_integration', false, 'Intégration Facebook — non développée, réservé pour activation future.'),
  ('tiktok_integration', false, 'Intégration TikTok — non développée, réservé pour activation future.'),
  ('youtube_integration', false, 'Intégration YouTube — non développée, réservé pour activation future.');
