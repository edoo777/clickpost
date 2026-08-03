-- Phase B — Stratégie éditoriale complète des marques. Additif uniquement : aucune colonne
-- retirée, aucune donnée existante modifiée. Enrichit la table brands déjà existante (aucun
-- second système de marque créé).

alter table public.brands
  add column if not exists audience_pain_points text[] not null default '{}',
  add column if not exists value_proposition text,
  add column if not exists publishing_frequency text,
  add column if not exists monthly_publishing_goal integer not null default 0,
  add column if not exists preferred_content_types text[] not null default '{}',
  add column if not exists preferred_formats text[] not null default '{}',
  add column if not exists success_metrics text[] not null default '{}';
