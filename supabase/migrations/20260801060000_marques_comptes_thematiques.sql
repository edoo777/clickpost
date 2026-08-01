-- Configuration des marques, comptes affiliés et thématiques.
-- Additif uniquement : toutes les nouvelles colonnes sont nullables (ou avec valeur par défaut
-- sûre), aucune contrainte existante resserrée, aucune donnée existante affectée.

-- Marques : niche déjà couverte par `industry` (existant) — ajoute sous-niche, positionnement
-- et marché/pays, absents jusqu'ici.
alter table public.brands
  add column sub_niche text,
  add column positioning text,
  add column market text;

-- Thématiques : description et mots-clés, absents jusqu'ici (F.).
alter table public.themes
  add column description text,
  add column keywords text[] not null default '{}';

-- Comptes affiliés : lien fiable par identifiant vers la marque, en plus du nom en texte libre
-- déjà existant (`brand`, conservé pour compatibilité) — et nouveau statut « profil renseigné,
-- connexion API non configurée », seul statut que l'application pose désormais elle-même.
-- `connected`/`syncing`/`expired` restent des valeurs valides pour une future intégration OAuth
-- réelle, mais ne sont plus jamais posées par le code actuel.
alter table public.accounts
  add column brand_id uuid references public.brands(id);

alter table public.accounts
  drop constraint accounts_status_check;

alter table public.accounts
  add constraint accounts_status_check
  check (status in ('connected', 'disconnected', 'expired', 'error', 'syncing', 'profile_only'));

create index accounts_brand_id_idx on public.accounts (brand_id);
