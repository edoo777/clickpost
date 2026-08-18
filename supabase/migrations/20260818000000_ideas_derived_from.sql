-- Chantier repurposing/promotion : trace la relation entre un contenu dérivé (réutilisation d'une
-- publication ou d'une idée existante pour une autre plateforme, un autre format, une variante...)
-- et son contenu d'origine — jamais une simple copie qui perd la traçabilité. Auto-référence sur
-- `ideas` : le contenu d'origine peut lui-même être une idée déjà transformée en publication (voir
-- `publication_id`), ce qui couvre aussi bien "réutiliser une idée" que "réutiliser une
-- publication" sans dupliquer le modèle. Nullable, additif, aucune donnée existante affectée.

alter table public.ideas add column if not exists derived_from_id uuid references public.ideas(id) on delete set null;

create index if not exists ideas_derived_from_id_idx on public.ideas (derived_from_id) where derived_from_id is not null;
