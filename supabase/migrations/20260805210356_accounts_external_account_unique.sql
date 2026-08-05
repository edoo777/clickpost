-- Empêche structurellement un doublon de compte social réellement connecté pour la même
-- identité distante dans un même workspace (ex. deux lignes LinkedIn pour le même
-- external_account_id après un double clic sur "Connecter" déclenchant deux échanges OAuth
-- concurrents avec des codes différents — l'upsert applicatif par SELECT-puis-INSERT ne suffit
-- pas seul à fermer cette fenêtre de course). Exclut les comptes "profil renseigné" (aucune
-- connexion API réelle, external_account_id toujours NULL) : ils restent libres, seuls les
-- comptes réellement connectés à une identité distante précise sont contraints. Additif et
-- idempotent, aucune donnée existante affectée.
create unique index if not exists accounts_workspace_platform_external_account_unique
  on public.accounts (workspace_id, platform, external_account_id)
  where external_account_id is not null and deleted_at is null;
