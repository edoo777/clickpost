-- Aligne le schéma Supabase avec des champs déjà réels côté TypeScript (Brand.contentExamples,
-- TopicBatch.standaloneNiche, TopicBatch.adhocThemeLabel) mais jamais migrés — cause exacte des
-- erreurs PGRST204 observées ("Could not find the 'standalone_niche' column of 'topic_batches'
-- in the schema cache." / "Could not find the 'content_examples' column of 'brands' in the
-- schema cache."). Vérifié : ni un problème de mapping (camelCase -> snake_case déjà correct),
-- ni un cache PostgREST simplement obsolète — ces colonnes n'ont jamais existé dans aucune
-- migration ni sur la base distante (confirmé par lecture directe d'information_schema.columns).
-- Additif uniquement : aucune colonne retirée, aucune donnée existante modifiée.

alter table public.brands
  add column if not exists content_examples jsonb not null default '[]'::jsonb;

alter table public.topic_batches
  add column if not exists standalone_niche text,
  add column if not exists adhoc_theme_label text;
