-- Phase E — Promotion et diffusion. Additif uniquement : aucune colonne retirée, aucune donnée
-- existante modifiée. Même convention que media/comments/history/publish_attempts déjà en jsonb
-- sur cette table — la checklist de promotion (huit tâches fixes par publication, voir
-- src/types/promotion.ts) reste rattachée directement à la publication, jamais un second système.

alter table public.publications
  add column if not exists promotion_tasks jsonb not null default '[]'::jsonb;
