-- Calendrier éditorial et vues multiples des publications.
-- Additif uniquement : élargit la contrainte de type de vue enregistrée pour couvrir les
-- nouvelles vues Cartes et Liste, et ajoute le stockage des largeurs de colonnes du tableau
-- (SavedView.columnWidths, optionnel côté application). Aucune table supprimée, aucune donnée
-- existante affectée : les lignes actuelles (view_type in table/calendar/kanban) restent valides,
-- column_widths démarre à '{}' pour toutes les vues déjà enregistrées.

alter table public.saved_views
  drop constraint saved_views_view_type_check;

alter table public.saved_views
  add constraint saved_views_view_type_check
  check (view_type in ('table', 'calendar', 'kanban', 'cards', 'list'));

alter table public.saved_views
  add column column_widths jsonb not null default '{}'::jsonb;
