-- Première intégration sociale réelle de ClickPost (LinkedIn, plateforme pilote). Additif et
-- idempotent uniquement : aucune colonne retirée, aucune donnée existante modifiée, chaque ajout
-- protégé par IF NOT EXISTS. Réutilise entièrement `accounts` (comptes affiliés déjà existants) —
-- aucun second système de comptes créé.

-- Métadonnées de connexion réelle sur les comptes déjà existants — jamais le jeton lui-même
-- (voir social_connections plus bas). Ces colonnes sont sûres à exposer au client (aucune ne
-- permet de reconstruire un jeton) : identifiant du membre LinkedIn autorisé, portées d'accès
-- réellement accordées, expiration du jeton et dernière vérification, pour un affichage honnête
-- de l'état de connexion sans jamais renvoyer le secret lui-même.
alter table public.accounts
  add column if not exists external_account_id text,
  add column if not exists oauth_scopes text[] not null default '{}',
  add column if not exists token_expires_at timestamptz,
  add column if not exists last_checked_at timestamptz;

-- Ajoute "insufficient_permission" à l'ensemble des statuts déjà valides — distingue un refus de
-- permission LinkedIn confirmé d'une erreur générique. Même procédure que la migration
-- 20260801060000 (drop + recreate de la contrainte), qui avait déjà ajouté 'profile_only' de la
-- même manière : aucune ligne existante n'est affectée, seul l'ensemble des valeurs autorisées
-- s'élargit.
alter table public.accounts
  drop constraint if exists accounts_status_check;

alter table public.accounts
  add constraint accounts_status_check
  check (status in ('connected', 'disconnected', 'expired', 'error', 'syncing', 'profile_only', 'insufficient_permission'));

-- ---------------------------------------------------------------------------------------
-- social_connections — jetons OAuth chiffrés, jamais accessibles depuis le client.
--
-- Sécurité par construction : RLS activée, AUCUNE politique accordée à `authenticated` ni
-- `anon` — une table avec RLS activée et zéro politique refuse strictement toute ligne à ces
-- rôles, quels que soient les GRANTs de table par ailleurs (comportement standard PostgreSQL).
-- Seule la clé service_role (jamais exposée au client, utilisée uniquement par les routes
-- serveur OAuth/publication de ClickPost — voir docs/linkedin-test-integration.md) peut lire ou
-- écrire cette table, car ce rôle contourne RLS par conception dans Supabase.
--
-- access_token_encrypted/refresh_token_encrypted contiennent un chiffrement applicatif
-- (AES-256-GCM, voir src/lib/oauth/token-encryption.ts) réalisé AVANT l'écriture en base — même
-- une fuite de la base ou de la clé service_role seule ne suffit pas à récupérer un jeton en
-- clair sans TOKEN_ENCRYPTION_KEY, gardée uniquement dans les variables d'environnement serveur.
-- ---------------------------------------------------------------------------------------
create table public.social_connections (
  id uuid primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  platform text not null,
  access_token_encrypted text not null,
  refresh_token_encrypted text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id)
);

create index social_connections_workspace_id_idx on public.social_connections (workspace_id);
create index social_connections_account_id_idx on public.social_connections (account_id);

alter table public.social_connections enable row level security;
-- Aucune politique créée intentionnellement — voir le commentaire ci-dessus.
