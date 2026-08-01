-- Génération d'idées organisée par thématique — sépare structurellement la thématique (le
-- sujet) du type de contenu (l'angle éditorial : Conseil, Preuve, Offre…), et permet de relier
-- plusieurs blocs générés ensemble lors d'une même demande multi-thématiques.
-- Additif uniquement : toutes les colonnes sont nullables, aucune contrainte, aucune donnée
-- existante affectée. Les lignes déjà présentes gardent ces colonnes à NULL (aucune
-- reclassification silencieuse — voir docs/limites-connues.md).

alter table public.topics
  add column content_type text;

alter table public.ideas
  add column content_type text;

alter table public.topic_batches
  add column content_type_distribution jsonb,
  add column group_id uuid,
  add column tone text,
  add column source text;
