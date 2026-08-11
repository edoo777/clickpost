# ClickPost — Checkpoint de session (2026-08-11)

Ce document est la **source de vérité** pour reprendre le projet dans une nouvelle
session. Il reflète l'état réel du code au moment du checkpoint, pas un objectif
ou une intention. Quand un autre document de `docs/` contredit celui-ci sur l'état
fonctionnel, **ce fichier fait foi** (il a été vérifié en relisant le code, pas
seulement les anciens rapports — plusieurs docs plus anciens sont périmés, voir
section 9).

## 1. Qu'est-ce que ClickPost

SaaS de gestion de contenu social multi-marques : stratégie éditoriale, génération
de contenu assistée par IA, planification, collaboration/approbation, publication
et analyse — pour agences marketing, créateurs de contenu, équipes marketing
internes, gestionnaires de marque, approbateurs clients, admins plateforme.

Stack : Next.js 16.2.11 (React 19, TypeScript, App Router, Turbopack) côté front ;
Supabase (Postgres, Auth, Storage) côté back ; Anthropic Claude pour l'IA
générative ; Tiptap pour l'édition riche ; déploiement cible Vercel.

Règle de travail du projet (voir `CLAUDE.md`, toujours valide) : toujours
confirmer avant d'installer une dépendance ou d'exécuter une action structurante,
et toujours proposer un plan avant toute fonctionnalité importante.

## 2. Architecture

- `src/app/(dashboard)/...` : pages de l'application connectée (aucune landing
  page publique — `/` redirige vers `/connexion` si non authentifié, voir
  `src/proxy.ts`, l'équivalent du middleware Next.js).
- `src/app/api/...` : routes serveur (IA, LinkedIn, cron, calendrier).
- `src/lib/supabase/` : `client.ts` (navigateur), `server.ts` (Server
  Components/Route Handlers), `service-role.ts` (clé service_role, réservée aux
  routes serveur — jamais exposée au client).
- `src/lib/sync/` : moteur de synchronisation cloud (pull Supabase → état local),
  mappers, verrouillage par révision pour éviter les écrasements concurrents.
- `src/lib/ai/` : client Anthropic (`anthropic-client.ts`), classification
  d'erreurs, prompts par fonctionnalité (atelier, copilote, générateur, etc.),
  rate-limiting (`rate-limit.ts`).
- `src/lib/linkedin/` : seule intégration réseau social réelle (OAuth, publish,
  scheduler, organizations, stats-provider).
- `src/lib/publishing/providers.ts` : registre générique `PublishProvider` par
  plateforme — toutes les plateformes sauf LinkedIn renvoient volontairement
  `isConfigured() => false` (jamais de faux succès simulé).
- `src/lib/*-data.ts` : données de démonstration, explicitement exclues de toute
  synchronisation vers Supabase (`src/lib/sync/seed-registry.ts`).
- Pas d'infrastructure de test automatisé (pas de Jest/Vitest/Playwright/Cypress)
  — la vérification repose sur `tsc` (via `next build`), `eslint`, et des tests
  manuels documentés dans `docs/tests-manuels.md`.

## 3. Modèle de données

23 migrations réelles dans `supabase/migrations/` (de `20260729...` à
`20260805210356_accounts_external_account_unique.sql`). Tables principales :
`profiles`, `workspaces`, `workspace_members`, `workspace_branding`, `brands`,
`accounts`, `campaigns`, `themes`, `topic_batches`, `topics`, `ideas`,
`content_versions`, `workflow_stages`, `publications`, `saved_views`,
`social_connections` (jetons LinkedIn chiffrés AES-256-GCM, RLS sans policy
client — accès uniquement via `service_role`).

⚠️ `docs/migrations.md` (8 migrations listées, "F1.9") et
`docs/modele-donnees.md` ("15 tables, F1.9") sont **périmés** — ils ne couvrent
pas LinkedIn ni les ajouts les plus récents. À régénérer avant d'aller plus loin
si quelqu'un doit s'appuyer dessus pour le schéma exact ; en attendant, se fier
aux fichiers de migration eux-mêmes.

RLS activée sur toutes les tables, fonctions `is_workspace_member()` /
`is_workspace_admin()`. Limite connue : la restriction fine « reviewer cantonné
à certaines marques » n'est appliquée que côté application, pas en RLS.

## 4. État par fonctionnalité

Légende : ✅ réel · 🟡 partiel/mixte · 🎭 simulé (mais honnête, jamais déguisé) · ⛔ absent

| Domaine | État | Détail |
|---|---|---|
| Authentification | ✅ | Supabase Auth réel, PKCE/OAuth callback, session rafraîchie par `src/proxy.ts`, RLS active. |
| Supabase / DB | ✅ | 23 migrations réelles appliquées, sync cloud↔local fonctionnelle. Doc de schéma périmée (voir §3). |
| IA / Claude | ✅ | `isAnthropicConfigured()` exige `ANTHROPIC_API_KEY` + `ANTHROPIC_MODEL` côté serveur uniquement. Quasi toutes les actions IA sont branchées à Claude, avec repli simulé transparent (`fallbackReason` affiché) en cas d'échec/absence de clé — jamais un mock déguisé en résultat réel. |
| Copilote éditorial | ✅ (non commité) | `src/app/api/ia/copilot/route.ts` réellement branché à Claude (auth Supabase, rate-limit, contexte réel marque/idées/publications). Intégré par défaut dans `assistant-ia/page.tsx`. **Jamais testé dans un navigateur réel** — à valider avant de considérer comme acquis. |
| Atelier | ✅ | Génération complète + presets réellement branchés à Claude, repli simulé si erreur. Presets nouvellement ajoutés (`api/ia/atelier/preset`, non commités). |
| Boîte à idées / Banque / Générateur | ✅ | CRUD réel + actions IA réelles (génération par lot sur clic explicite, actions rapides ciblées). |
| Calendrier / Calendrier éditorial | ✅ | Données réelles (publications/idées en base), jours fériés via API dédiée. |
| Publications | 🟡 | CRUD/statuts réels (incl. `publishing` en verrouillage optimiste). Publication automatique réelle **uniquement pour LinkedIn** ; autres plateformes → publication manuelle uniquement. |
| Marques / comptes | ✅ (LinkedIn) / 🎭 (autres) | CRUD marques réel (RLS owner/admin). Connexion LinkedIn = vraie OAuth. Autres réseaux : ajout de compte = simulation locale honnête (`profile_only`), pas d'OAuth réel. |
| Statistiques / Performances | 🟡 | 3 états explicites (Importé / Démonstration / Non disponible), jamais de faux zéro. `linkedInStatsProvider` renvoie toujours `null` (portées OAuth actuelles insuffisantes pour l'analytics). Import CSV manuel = seule source réelle, **non synchronisé multi-appareil**. |
| LinkedIn | ✅ (profil perso) / ⏸ (Page pro) | OAuth réel, publication réelle (texte + jusqu'à plusieurs images), planificateur réel (Vercel Cron `/api/cron/linkedin-publish`, verrouillage + retry x3). Page/organisation : code écrit mais **désactivé** (`LINKEDIN_ORGANIZATION_ACCESS_ENABLED=false`), non testé en conditions réelles faute d'approbation LinkedIn. Détail complet : `docs/linkedin-production-readiness.md`. |
| Autres réseaux sociaux | ⛔ | Aucun autre provider réel (Instagram, Facebook, X, TikTok, etc.). Architecture générique prête, non implémentée. Procédure documentée : `docs/social-platform-setup.md`. |
| Administration / équipe | 🎭 | Gestion de rôles/membres avec UI réelle mais persistance applicative découplée de `auth.users` (rapprochement fragile par nom). Invitation = `"Invitation simulée envoyée à ${email}."` explicite dans le code. RLS workspace réelle en dessous, elle. |
| Landing page / site web | ⛔ | Aucune page marketing publique. `/` redirige directement vers `/connexion`. |
| Déploiement Vercel | 🟡 préparé, non exécuté | `vercel.json` configure le cron LinkedIn (5 min). Checklist à jour : `docs/deployment-checklist.md` (le fichier `checklist-deploiement.md` plus ancien est périmé). Aucune action de déploiement n'a été faite automatiquement. |
| Paiement / abonnements | ⛔ | Aucune intégration Stripe ni système de paiement. Section "Abonnement" du profil affiche littéralement "Aucun système de paiement actif dans cette version." |

## 5. Décisions techniques importantes à ne pas oublier

- **Jamais de simulation déguisée en réel** : c'est un principe de conception
  appliqué partout (stats LinkedIn, providers non configurés, invitation équipe,
  abonnement) — toute donnée non réelle doit rester visiblement étiquetée comme
  telle. À préserver dans tout futur développement.
- **Clé `service_role` Supabase** : utilisée uniquement dans des routes serveur
  (LinkedIn, cron). Ne jamais l'exposer côté client ni l'utiliser dans un
  composant `"use client"`.
- **Verrouillage optimiste des publications** : `status = 'publishing'` posé par
  mise à jour conditionnelle (compare-and-swap applicatif), avec récupération
  après 10 min de blocage et max 3 tentatives — même principe que le
  verrouillage par révision du moteur de sync. Ne pas réintroduire de statut
  "en cours" sans ce mécanisme.
- **Fuseaux horaires** : `scheduled_for` est un `timestamptz` Supabase ; la
  conversion aller-retour depuis les champs `datetime-local` se fait dans
  `src/lib/scheduling-time.ts`. Bug déjà corrigé une fois — ne pas réintroduire
  de manipulation naïve de date/heure locale sans passer par ce module.
- **Portées OAuth LinkedIn minimales par défaut** (`openid profile email
  w_member_social`) : les portées organisation/analytics sont distinctes et
  nécessitent chacune une revue LinkedIn séparée. Ne jamais supposer une portée
  accordée sans vérification explicite.
- **CRON_SECRET only** pour `/api/cron/linkedin-publish` : pas de session
  cookie possible depuis Vercel Cron, exemption explicite dans `src/proxy.ts` —
  à préserver si d'autres routes cron sont ajoutées.
- **Rate-limiting** centralisé dans `src/lib/ai/rate-limit.ts`, appliqué à
  toutes les routes IA — à réutiliser pour toute nouvelle route IA plutôt que
  réinventer.

## 6. Bloquants avant d'inviter des utilisateurs bêta

1. **Tester le Copilote éditorial et les nouveaux presets Atelier dans un vrai
   navigateur** (jamais fait — code non commité, non validé manuellement).
2. **Recette navigateur complète de LinkedIn** (clair/sombre, mobile, deux
   comptes réels, première exécution Cron en production) — listée section 9 de
   `docs/linkedin-production-readiness.md`.
3. **Décider du sort des "autres réseaux sociaux"** : soit les masquer/étiqueter
   clairement "bientôt disponible" dans l'UI si un bêta-testeur tente de
   connecter Instagram/Facebook/X, soit ne proposer que LinkedIn en bêta.
4. **Décider du sort de l'admin/équipe simulée** : soit limiter la bêta à un
   seul utilisateur par workspace, soit clarifier dans l'UI que l'invitation
   n'envoie pas réellement d'email.
5. **Régénérer `docs/modele-donnees.md` et `docs/migrations.md`** s'il faut les
   donner à un tiers — actuellement trompeurs sur le schéma réel.
6. **Déploiement Vercel effectif** : variables d'environnement de production à
   configurer (voir `docs/deployment-checklist.md`), premier déploiement réel à
   faire avec autorisation explicite.

## 7. Peut attendre après les premiers tests utilisateurs

- Statistiques LinkedIn réelles (bloqué par une portée OAuth supplémentaire
  soumise à revue LinkedIn — hors de notre contrôle direct).
- Publication sur Page LinkedIn (organisation) — bloqué par approbation
  LinkedIn, code déjà écrit et prêt à activer.
- Intégration d'autres réseaux sociaux (Instagram, Facebook, X, TikTok...).
- Vrai système d'invitation d'équipe relié à `auth.users`.
- Paiement/abonnement (Stripe ou équivalent).
- Infrastructure de test automatisé (Jest/Vitest/Playwright).
- Export PDF des rapports de performance.
- Synchronisation multi-appareil de l'import CSV de statistiques.
- Fusion de conflits champ par champ (actuellement enregistrement entier).
- Supabase Realtime (actuellement pull uniquement, une fois par session).

## 8. Build / qualité au moment du checkpoint

- `npm run build` : ✅ propre (TypeScript strict + Turbopack, 50 routes
  générées, aucune erreur).
- `npm run lint` : ✅ propre (0 erreur, 0 warning).
- Deux vraies erreurs TypeScript ont été trouvées et corrigées pendant ce
  checkpoint dans le code IA non commité (`api/ia/copilot/route.ts` : type de
  `format` incorrect ; `AssistantCopilotView.tsx` : type de `role` non littéral
  + `IconLightBulb`/`IconLightbulb` mal orthographié). Un warning ESLint
  `set-state-in-effect` a aussi été corrigé (calcul déplacé au rendu plutôt que
  dans un `useEffect`), ainsi que des imports/types inutilisés.

## 9. Fiabilité des autres documents `docs/`

Plusieurs documents sont **antérieurs** à l'intégration LinkedIn réelle et à une
partie des ajouts IA récents ; leurs constats généraux (pas de test auto, pas de
Realtime, etc.) restent valables mais leurs affirmations sur "aucune plateforme
sociale n'a d'intégration réelle" sont dépassées par LinkedIn :
- `docs/limites-connues.md`, `docs/full-functional-qa-report.md`,
  `docs/overnight-final-report.md`, `docs/overnight-progress.md` — à lire comme
  un historique, pas un état actuel.
- `docs/migrations.md`, `docs/modele-donnees.md` — périmés sur le schéma (voir §3).
- `docs/checklist-deploiement.md` — remplacé par `docs/deployment-checklist.md`
  (plus récent, plus complet, fait foi).
- `docs/linkedin-production-readiness.md`, `docs/social-platform-setup.md`,
  `docs/linkedin-test-integration.md`, `docs/deployment-checklist.md`,
  `docs/content-creator-journey.md` — à jour, fiables.

## 10. CLAUDE.md

Vérifié : les instructions générales du projet dans `CLAUDE.md` (vision produit,
utilisateurs cibles, stack, règles de travail — confirmer avant dépendance/action
structurante, plan avant fonctionnalité importante) restent exactes et n'ont pas
besoin de mise à jour.
