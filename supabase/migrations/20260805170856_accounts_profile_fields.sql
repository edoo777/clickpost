-- Corrige un décalage de schéma (catégorie A : champs prévus côté TypeScript depuis F1.5,
-- jamais migrés) qui fait échouer toute synchronisation d'un compte affilié dont `profileUrl`,
-- `language` ou `audienceOrMarket` est renseigné (PGRST204 "Could not find the 'profile_url'
-- column of 'accounts'") — reproductible via le mappeur générique camelCase→snake_case
-- (src/lib/sync/mappers.ts) pour n'importe quel compte, pas seulement lors d'une connexion
-- LinkedIn. Additif et idempotent : aucune donnée existante affectée, aucune colonne retirée.
alter table public.accounts
  add column if not exists profile_url text,
  add column if not exists language text,
  add column if not exists audience_or_market text;
