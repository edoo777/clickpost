-- Prépare l'intégration API réelle d'Instagram, Facebook, TikTok, X et YouTube (voir
-- src/lib/instagram, src/lib/facebook, src/lib/tiktok, src/lib/x, src/lib/youtube). Additif et
-- idempotent uniquement : aucune colonne retirée, aucune donnée existante modifiée. Réutilise
-- entièrement `accounts` et `social_connections` (déjà génériques par plateforme depuis la
-- migration LinkedIn 20260803194148 — `platform text not null`, aucun schéma LinkedIn
-- uniquement) : aucune nouvelle table n'est nécessaire pour ces cinq plateformes.

-- Métadonnées additionnelles spécifiques à une plateforme, sans justifier une colonne dédiée
-- chacune — usage principal aujourd'hui : le lien Page Facebook <-> compte professionnel
-- Instagram (nécessaire pour re-dériver un jeton de Page à jour au rafraîchissement, voir
-- src/lib/meta/oauth.ts, refreshPageToken). Jamais un jeton ni un secret : ce champ est sûr à
-- exposer au client, au même titre que `external_account_id`/`oauth_scopes`.
alter table public.accounts
  add column if not exists platform_metadata jsonb not null default '{}'::jsonb;
