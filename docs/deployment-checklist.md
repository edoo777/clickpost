# Checklist de déploiement — ClickPost

Ce document prépare le déploiement sans le déclencher — aucune action de ce document n'a été
exécutée automatiquement pendant la session autonome (interdiction explicite de déployer).

## Variables d'environnement requises

Voir `.env.example` pour le patron exact (jamais de secret commité). Résumé :

| Variable | Obligatoire | Portée | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Oui | Client + serveur | URL du projet Supabase. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Oui | Client + serveur | Clé `anon` uniquement — jamais `service_role`. |
| `ANTHROPIC_API_KEY` | Non (dégrade proprement) | Serveur uniquement | Sans elle, génération Claude désactivée avec message explicite (`isAnthropicConfigured()`), jamais simulée comme réussie. |
| `ANTHROPIC_MODEL` | Non | Serveur uniquement | Modèle Claude utilisé pour toute génération. |
| `YOUTUBE_API_KEY` | Non | Serveur uniquement | Sans elle, `/tendances` affiche un état "configuration manquante" pour cette source, jamais de fausses tendances. |
| `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` / `LINKEDIN_REDIRECT_URI` / `LINKEDIN_API_VERSION` | Non (LinkedIn reste désactivé sans elles) | Serveur uniquement | Voir `docs/linkedin-production-readiness.md`. |
| `TOKEN_ENCRYPTION_KEY` | Requise si LinkedIn activé | Serveur uniquement | Chiffrement des jetons OAuth stockés — jamais réutilisée entre environnements. |
| `SUPABASE_SERVICE_ROLE_KEY` | Requise si LinkedIn activé | Serveur uniquement | Contourne la RLS par conception — jamais exposée au client, jamais utilisée hors des routes LinkedIn. |
| `CRON_SECRET` | Requise si le planificateur LinkedIn est utilisé | Serveur uniquement (+ config Vercel Cron) | Authentifie les appels de `/api/cron/linkedin-publish`. |
| `LINKEDIN_ORGANIZATION_ACCESS_ENABLED` | Non | Serveur uniquement | Reste `false` tant que LinkedIn n'a pas approuvé l'accès Page Entreprise — voir Phase 4 de `docs/linkedin-production-readiness.md`. |

Aucune autre plateforme sociale n'a de variable d'environnement — voir
`docs/social-platform-setup.md` pour la procédure complète le jour où l'une d'elles sera branchée.

## Documentation Supabase

- Projet géré via le Supabase CLI (`npx supabase db push` / `--dry-run`), pas uniquement le SQL
  Editor du dashboard — toutes les migrations de ce dépôt sont versionnées dans
  `supabase/migrations/`.
- Authentification : fournisseur Email/mot de passe activé (Authentication → Providers).
- **Site URL** / **Redirect URLs** à configurer avec le domaine de production réel avant tout
  déploiement (sinon les liens de réinitialisation de mot de passe pointent vers `localhost`).
- RLS activée sur toutes les tables de workspace, fonction `is_workspace_member()` réutilisée
  systématiquement (voir chaque migration pour le détail par table).

## Documentation Storage

- Bucket privé unique : `publication-media` (voir
  `supabase/migrations/20260803024525_publication_media_storage.sql`).
- Chemin : `workspaceId/brandId-ou-"sans-marque"/publicationId/mediaId.ext`.
- RLS sur `storage.objects` via `is_workspace_member(((storage.foldername(name))[1])::uuid)`.
- URLs signées uniquement (1 heure par défaut), jamais d'URL publique permanente.
- Limite de taille configurée dans `supabase/config.toml` (`file_size_limit = "200MiB"`).

## Procédure de migration

1. Écrire la migration dans `supabase/migrations/` (format `YYYYMMDDHHMMSS_description.sql`).
2. `npx supabase db push --dry-run` — vérifier qu'elle est bien la seule en attente et qu'elle est
   additive (jamais de `DROP COLUMN`/`DROP TABLE` sans confirmation explicite et sauvegarde
   préalable).
3. `npx supabase db push` pour l'appliquer réellement.
4. Vérifier avec `npx supabase db push --dry-run` à nouveau (`upToDate: true` attendu).
5. Vérification en lecture seule optionnelle : `npx supabase db query "..." --linked` pour
   confirmer les colonnes/politiques attendues (jamais d'écriture directe par ce canal — les
   écritures passent uniquement par l'application).

## Configuration Vercel (ou équivalent Next.js)

- Renseigner toutes les variables d'environnement ci-dessus dans les paramètres du projet (jamais
  dans le dépôt).
- Build command standard Next.js (`next build`) — déjà vérifié fonctionnel dans ce dépôt.
- Domaine de production à synchroniser avec le **Site URL** Supabase (voir plus haut).
- **Cron LinkedIn** (`vercel.json`) : exécution planifiée toutes les 5 minutes de
  `/api/cron/linkedin-publish`. Le palier gratuit Vercel limite les Cron Jobs à une exécution
  quotidienne — sur ce palier, adapter `vercel.json` en conséquence ou déclencher manuellement
  (voir `docs/linkedin-production-readiness.md`). `CRON_SECRET` doit être défini côté Vercel pour
  que l'en-tête d'autorisation automatique soit envoyé.

## Configuration Anthropic

- Clé créée sur https://console.anthropic.com/settings/keys — jamais utilisée côté client
  (uniquement dans `src/app/api/ia/**/route.ts`).
- Modèle configurable via `ANTHROPIC_MODEL`, jamais codé en dur.
- Rate limiting déjà en place (`src/lib/ai/rate-limit.ts`) — vérifier que les seuils restent
  adaptés au volume réel avant un lancement à grande échelle.

## Configuration YouTube (Tendances)

- Clé créée sur https://console.cloud.google.com/apis/credentials, API "YouTube Data API v3"
  activée, restriction "API restrictions" recommandée (voir commentaire dans `.env.example`).
- Quota gratuit : 10 000 unités/jour, 1 unité par appel `videos.list`.

## Configuration des réseaux sociaux

LinkedIn dispose d'une intégration réelle (voir `docs/linkedin-production-readiness.md`) —
toutes les autres plateformes restent au stade architecture prête uniquement
(`PublishProvider`/`StatsProvider`, voir `docs/social-platform-setup.md`).

## Procédure de test avant mise en production

- [ ] `npx tsc --noEmit`, `npm run lint`, `npm run build` sans erreur.
- [ ] Créer un compte, vérifier la création automatique du workspace par défaut.
- [ ] Créer une marque, vérifier la persistance après rechargement.
- [ ] Créer une idée → note → publication → média → révision → approbation → publication
  manuelle → checklist de promotion — parcours complet sans blocage.
- [ ] Vérifier qu'un deuxième compte dans un workspace distinct ne voit aucune donnée du premier.
- [ ] Vérifier les thèmes clair/sombre/système.
- [ ] Vérifier le comportement hors ligne (voir `docs/overnight-progress.md`, section
  synchronisation, pour les états attendus).

## Checklist de déploiement

- [ ] Toutes les migrations appliquées et vérifiées (`upToDate: true`).
- [ ] Variables d'environnement de production renseignées.
- [ ] Site URL / Redirect URLs Supabase configurées avec le domaine réel.
- [ ] `docs/overnight-final-report.md` relu — aucune limite bloquante ignorée.
- [ ] Sauvegarde de la base de données confirmée avant tout déploiement majeur.

## Procédure de rollback

- **Application** : redéployer la révision précédente (aucune migration destructive dans ce
  dépôt à ce jour — un rollback applicatif ne nécessite donc pas de rollback de schéma).
- **Base de données** : toutes les migrations de cette session sont additives (`ADD COLUMN IF NOT
  EXISTS`) — un rollback ne perd aucune donnée existante ; retirer une colonne ajoutée par erreur
  se fait avec `ALTER TABLE ... DROP COLUMN IF EXISTS ...` dans une migration dédiée, jamais en
  modifiant une migration déjà appliquée.
- **Storage** : les fichiers déjà téléversés ne sont jamais supprimés par un rollback applicatif.

## Limites connues à ce jour

Voir `docs/overnight-final-report.md` pour la liste complète et à jour.
