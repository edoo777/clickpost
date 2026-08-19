# ClickPost — État de préparation bêta (session autonome du 2026-08-19)

Session de ~8h en autonomie complète, mandat : finaliser ClickPost au maximum pour une bêta réelle
sans interruption, en travaillant dans l'ordre P0→P9 fourni. Fait suite aux sessions précédentes
(voir `docs/autonomous-development-report.md`, `docs/clickpost-product-status.md`,
`docs/remaining-before-beta.md` — désormais partiellement obsolètes, ce document les remplace comme
référence la plus à jour) qui avaient livré l'Admin MVP, la landing page, LinkedIn réel, le module
Rapports, et une internationalisation FR/EN quasi complète (~97 %, achevée juste avant cette
session).

**Ne contient que des faits vérifiés** (build, typecheck, test automatisé, requête SQL live, appel
de route réel) — jamais une estimation présentée comme un fait. Quand une case dit « non testé »,
c'est une absence de preuve, pas nécessairement un bug.

---

## 1. Fonctionnalités terminées cette session

- **Fondations analytics produit** (`product_events`, table + RLS) : funnel réel (signup →
  onboarding → workspace → marque → réseau connecté), jamais un chiffre fabriqué. Émis
  actuellement pour : `signup` (trigger `handle_new_user`, 100 % fiable), `workspace_created`
  (trigger `ensure_default_workspace`, uniquement à la vraie création), `brand_created`,
  `social_connected` (LinkedIn), `onboarding_started`, `onboarding_completed`.
- **Fondations facturation** (`plans`, `workspace_subscriptions`) : 4 plans de référence
  (Gratuit/Starter/Pro/Agence) avec quotas IA/marques/comptes/membres configurables depuis la base
  (pas codés en dur dans l'UI) ; chaque workspace rattaché automatiquement au plan gratuit
  (statut honnête `"none"`, jamais `"active"` sans paiement réel confirmé).
- **Quota IA appliqué côté serveur** (`checkAiQuota()`), câblé AVANT l'appel Claude dans 7 routes
  IA connectées à une marque/workspace (voir §11), + 1 route partiellement câblée (garde de quota
  seule, `tendances/web-search`).
- **Journalisation d'usage IA réelle** (`ai_usage_events`) : tokens réels renvoyés par l'API
  Anthropic après chaque appel réussi, coût estimé à partir d'un barème public documenté (jamais
  un coût deviné a priori). 4 tests automatisés sur le calcul de coût.
- **Tableau de bord Admin Business & KPI** (`/admin/kpi`, nouveau) : DAU/WAU/MAU, entonnoir
  (inscriptions → onboarding → workspace → réseau connecté), publications créées/publiées,
  générations IA + coût estimé, répartition par plan/réseau/fonctionnalité IA, estimation
  solo/équipe. **MRR/churn/ARPU/conversion essai→payant affichent explicitement « Stripe non
  connecté »** — aucune donnée financière fabriquée, l'architecture calcule automatiquement ces
  indicateurs dès qu'un vrai abonnement existera.
- **Landing page** : nouvelles sections Tarifs (lit la vraie table `plans`, bandeau « gratuit
  pendant la bêta ») et FAQ (5 questions), FR/EN, vérifiées en direct (voir §6).
- **Sécurité** : 2 nouvelles alertes `db advisors` introduites par les nouvelles fonctions
  (`search_path` mutable, `SECURITY DEFINER` exécutable via RPC public) trouvées et corrigées
  immédiatement — 0 alerte WARN nouvelle au final (toujours les 6 déjà documentées/acceptées avant
  cette session, aucune régression).
- **i18n** (achevé juste avant cette session, ~97 %, non re-détaillé ici — voir le rapport dédié
  dans l'historique de conversation) : ce qui restait franco-seulement au global (sidebar,
  indicateur de sauvegarde/synchronisation `SaveStatusIndicator`, menu « Développer », pages
  Marques/Assistant IA, pages légales) a été traité comme un chantier séparé juste avant celui-ci.

## 2. Fonctionnalités partielles

- **Funnel produit** : 6 événements sur 15 définis dans le schéma (`PRODUCT_EVENT_NAMES`) sont
  réellement émis (voir §1). Les 9 restants (`idea_created`, `content_created`, `content_approved`,
  `content_scheduled`, `content_published`, `report_generated`, `ai_generation` [remplacé par
  `ai_usage_events`, plus riche — décision assumée, pas un oubli], `subscription_started`,
  `subscription_cancelled`) sont définis dans le type `ProductEventName` et l'émetteur
  `recordProductEvent()` existe, mais ne sont PAS câblés à leurs points d'origine. Raison : les
  points de création réels (idées, publications) passent par le moteur de synchronisation
  offline-first (`useSyncedPersistedState`), pas par une route API dédiée — trouver un point
  d'accroche sûr sans risquer de régression sur ce moteur central demandait plus de temps que le
  budget restant de cette session ne le permettait. `subscription_started/cancelled` nécessitent un
  webhook Stripe qui n'existe pas encore (voir §3).
- **Contrôle de quota IA** : câblé sur 7 routes/9 candidates (voir §11 pour le détail exact et les
  2 routes sans point d'accroche workspace).
- **Tarification affichée** : les 4 plans ont des limites réelles configurées en base, mais
  `price_usd_cents` reste `NULL` pour Starter/Pro/Agence (décision commerciale non prise) — la
  landing page affiche honnêtement « Tarif à venir » pour ces plans plutôt qu'un prix inventé.

## 3. Intégrations externes nécessitant vos identifiants

Rien de nouveau cette session par rapport à la liste déjà connue :

1. **Stripe** — aucune clé, aucun webhook. L'architecture (`plans`, `workspace_subscriptions`,
   colonnes `stripe_customer_id`/`stripe_subscription_id`) est prête à recevoir un webhook réel ;
   MRR/churn/ARPU se calculeront automatiquement dès que `workspace_subscriptions.status` recevra
   de vraies valeurs `"active"`/`"canceled"` via ce webhook.
2. **Instagram/Facebook, TikTok, X, YouTube** — comptes développeur absents (voir
   `docs/social-platform-setup.md`, inchangé cette session, toujours à jour).
3. **`GAMMA_API_KEY`** — absente, export PDF des rapports non fonctionnel (dégradation honnête déjà
   en place).
4. **`YOUTUBE_API_KEY`, `CRON_SECRET`** — absentes de `.env.local` local ; non requises pour tester
   le cœur du produit.
5. **Déploiement Vercel réel** — jamais effectué, toujours explicitement en pause (aucune demande
   de le faire cette session non plus).

## 4. Migrations à appliquer

**Aucune action requise de votre part** — les 5 nouvelles migrations de cette session ont déjà été
appliquées au projet Supabase lié (`npx supabase db push`, vérifié via `npx supabase migration
list` : 40/40 migrations synchronisées local ↔ distant) :

| Fichier | Objet |
|---|---|
| `20260819000000_analytics_billing_foundations.sql` | `product_events`, `ai_usage_events`, `plans` (+ 4 lignes seed), `workspace_subscriptions` + trigger d'auto-provisionnement. |
| `20260819000100_analytics_billing_search_path_fix.sql` | Corrige `search_path` mutable sur `bump_updated_at()`. |
| `20260819000200_ensure_default_subscription_revoke_public.sql` | Révoque l'exécution publique de `ensure_default_subscription()` (trigger uniquement). |
| `20260819000300_signup_product_event.sql` | Étend `handle_new_user()` pour émettre l'événement `signup`. |
| `20260819000400_workspace_created_product_event.sql` | Étend `ensure_default_workspace()` pour émettre `workspace_created` à la vraie création uniquement. |

## 5. Variables d'environnement manquantes

Inchangé par rapport aux sessions précédentes — voir §3. Aucune nouvelle variable requise par le
travail de cette session (les nouvelles tables utilisent les clients Supabase déjà configurés).

## 6. Tests automatisés effectués

- `npx tsc --noEmit` : 0 erreur (vérifié après chaque lot de changements, y compris après le travail
  de l'agent d'arrière-plan sur les routes IA).
- `npm run lint` : 0 erreur — 1 avertissement pré-existant sans rapport (`<img>` non optimisée,
  `ReportCoverSection.tsx`).
- `npx vitest run` : **53/53 tests passés** (9 fichiers), dont 4 nouveaux (`usage-tracking.test.ts`
  — calcul de coût IA : montant correct pour un modèle connu, 0 $ pour 0 token, repli sur le tarif
  par défaut pour un modèle inconnu plutôt qu'une erreur, mise à l'échelle linéaire).
- `npm run build` : succès, **68 routes générées** (dont la nouvelle `/admin/kpi`), aucune erreur.
- `git diff --check` : 0 erreur (uniquement des avertissements bénins CRLF/LF).
- **Vérifications live sur le projet Supabase lié** (`npx supabase db push`/`db advisors`/`db
  query`) : migrations appliquées et confirmées synchronisées, permissions `SECURITY DEFINER`
  vérifiées par requête directe sur `information_schema.routine_privileges` (pas seulement lues
  dans le code), 0 nouvelle alerte de sécurité après correctif.
- **Vérifications live en navigateur simulé (`curl`)**, serveur de développement local démarré
  pour cette session (laissé actif sur `http://localhost:3000`) :
  - `/bienvenue` → 200, section Tarifs affiche les 4 vrais plans (Gratuit/Starter/Pro/Agence) avec
    leurs quotas réels, section FAQ présente, en FR et en EN (cookie `clickpost-locale=en`,
    contenu confirmé traduit dans les deux langues).
  - `/admin/kpi` sans session → 307 (redirection correcte, page protégée).
  - `/conditions`, `/confidentialite` → 200.

## 7. Tests manuels à effectuer (navigateur humain réel)

Tout ce qui était déjà listé dans `docs/autonomous-development-report.md`/`remaining-before-beta.md`
reste valable (parcours complet inscription→publication, workflow d'approbation, sélecteur FR/EN,
responsive). S'ajoute cette session :

1. **Tableau de bord `/admin/kpi`** : se connecter avec `adminclickpost@gmail.com`, vérifier
   l'affichage des 4 filtres de période (7/30/90/365 jours), confirmer que les compteurs
   correspondent à une activité réelle générée en testant le parcours (inscription → onboarding →
   création marque → connexion LinkedIn) sur un compte de test.
2. **Quota IA** : épuiser le quota gratuit (20 générations/mois) sur un workspace de test et
   vérifier qu'un appel Claude supplémentaire renvoie bien une erreur 402 explicite plutôt qu'une
   génération silencieusement refusée ou un crash.
3. **Landing page** : vérifier visuellement la mise en page des nouvelles sections Tarifs/FAQ sur
   desktop/tablette/mobile (non vérifiable par l'agent, seulement le rendu HTML confirmé côté
   serveur).
4. **Coût IA affiché dans `/admin/kpi`** : comparer sur quelques appels réels au tableau de bord
   Anthropic Console pour confirmer que l'estimation (basée sur un barème documenté, pas l'API de
   facturation Anthropic) reste raisonnablement proche de la réalité.

## 8. État sécurité

Aucune régression. Audit RLS systématique déjà réalisé lors des sessions précédentes (25 tables,
0 fuite inter-workspace trouvée) — les 4 nouvelles tables de cette session (`product_events`,
`ai_usage_events`, `plans`, `workspace_subscriptions`) suivent strictement le même modèle
(`is_workspace_member()`, jamais d'écriture cliente sur les tables de configuration plateforme,
lecture publique uniquement là où c'est nécessaire à l'app). Vérifié en direct sur le projet lié,
pas seulement lu dans le code : `npx supabase db advisors --type security` → 6 alertes WARN, toutes
déjà documentées/acceptées avant cette session, 0 nouvelle. Un problème introduit par cette session
(exécution publique de `ensure_default_subscription()`) a été détecté et corrigé dans la même
session, avant tout commit.

**Rappel du principe déjà en place, revérifié** : `ADMIN_EMAILS` (liste serveur uniquement,
jamais en base), `requirePlatformAdmin()` sur les 3 routes `/api/admin/**`, gate serveur
indépendant du middleware sur `/admin/**` (défense en profondeur). Aucun secret commité
(`.gitignore` vérifié : seul `.env.example` est suivi par git).

## 9. État FR/EN

~97 % (achevé juste avant cette session, voir le rapport dédié). Rien de nouveau cette session
n'a introduit de régression — le nouveau tableau de bord `/admin/kpi` suit la même convention que
le reste de l'espace Admin (Server Component français uniquement, incompatibilité documentée avec
`useTranslations()`, cohérent avec `/admin`, `/admin/prompts`, etc.). La landing page (Tarifs/FAQ)
est entièrement traduite FR/EN et vérifiée en direct dans les deux langues (voir §6).

## 10. État de chaque réseau social

Inchangé cette session (voir `docs/social-platform-setup.md`, `docs/linkedin-production-readiness.md`) :

| Plateforme | État |
|---|---|
| LinkedIn | Intégration API réelle (OAuth, publication) — pilote fonctionnel, jamais retesté avec un compte réel cette session. |
| Instagram / Facebook / TikTok / X / YouTube / Threads / Pinterest | Architecture prête (`PublishProvider`), aucune intégration réelle — bloqué par l'absence de comptes développeur externes. |

## 11. État Admin

Toutes les fonctionnalités précédemment DONE restent DONE (prompts IA, textes produit,
utilisateurs, feature flags). **Nouveau cette session : `/admin/kpi`**, un vrai cockpit business —
voir §1. Accès vérifié protégé (307 sans session). Aucune donnée financière fabriquée : les
métriques Stripe-dépendantes affichent honnêtement leur indisponibilité plutôt qu'un placeholder
trompeur.

**Détail du câblage quota/usage IA** (7 routes complètes, 1 partielle, 5 documentées comme sans
point d'accroche) :

| Route | Câblage | `featureKey` |
|---|---|---|
| `copilot` | Quota + usage complets | `copilot` |
| `marques/suggest-themes` | Quota + usage complets | `marques.suggest_themes` |
| `atelier/rewrite-selection` | Quota + usage complets | `atelier.rewrite_selection` |
| `atelier/generation-complete` | Quota + usage complets | `atelier.generation_complete` |
| `atelier/preset` | Quota + usage complets | `atelier.preset` |
| `rapports/generate` | Quota + usage complets | `rapports.generate` |
| `generateur/topics` | Quota + usage complets (sauf mode `standalone`, sans marque) | `generateur.topics` |
| `publications/generate` | Quota + usage complets (sauf sans `brandId`) | `publications.generate` |
| `tendances/web-search` | Quota seul (usage non câblé — tokens uniquement dans une lib hors périmètre de la tâche) | — |
| `tendances/analyze`, `banque/quick-action` | Non câblés — aucun `brandId`/workspace résolvable, texte client uniquement | — |
| `tendances/report`, `tendances/youtube`, `tendances/news` | Non câblés — n'appellent pas Claude | — |

## 12. État analytics/KPI

Voir §1. Fondation posée et opérationnelle pour 6 des 15 événements du funnel ; usage IA
entièrement réel (tokens + coût estimé) sur 7 fonctionnalités IA sur 9 routes candidates.

## 13. État abonnement/quotas

Architecture posée (§1), quota IA mensuel appliqué côté serveur (jamais uniquement dans l'UI) sur
la majorité des routes IA connectées à une marque. Aucun paiement réel : tous les workspaces sont
actuellement sur le plan gratuit avec le statut honnête `"none"`. Prêt pour Stripe dès que les
clés seront fournies (voir §3).

## 14. Bugs connus

Aucun nouveau bug introduit cette session (tsc/lint/vitest/build systématiquement vérifiés après
chaque lot de changements, migrations vérifiées en direct). Bugs connus des sessions précédentes :
voir `docs/remaining-before-beta.md` §"Dette technique mineure" (inchangé, non ré-audité cette
session faute de temps face au périmètre demandé).

## 15. Étapes exactes pour lancer la bêta

1. Effectuer les tests manuels du §7 (en particulier le parcours complet et le quota IA).
2. Décider d'un prix réel pour Starter/Pro/Agence (actuellement `NULL`, affiché honnêtement comme
   « à venir ») et connecter Stripe si la bêta doit inclure un vrai paiement — sinon, la bêta peut
   démarrer entièrement gratuite (déjà le cas pour tout le monde aujourd'hui).
3. Décider de la portée réseaux sociaux pour la bêta (LinkedIn uniquement recommandé — déjà la
   position documentée des sessions précédentes).
4. Déployer sur Vercel (jamais fait, configuration à préparer par vous).
5. Inviter les premiers testeurs.

---

## Checklist

- **READY** : sécurité (RLS, admin, secrets), build/lint/tsc, i18n (~97 %), parcours utilisateur
  de base, LinkedIn (pilote), boucle Performances→Recommandations, fondations quota IA/facturation,
  tableau de bord Admin KPI (métriques d'usage), landing page (avec Tarifs/FAQ).
- **BLOCKED EXTERNAL** : Stripe (clés), Instagram/Facebook/TikTok/X/YouTube (comptes développeur),
  Gamma (clé), déploiement Vercel (autorisation explicite requise).
- **HUMAN TEST REQUIRED** : parcours complet en navigateur réel, responsive mobile/tablette,
  workflow d'approbation LinkedIn de bout en bout, quota IA (épuisement réel), tableau de bord
  `/admin/kpi` avec activité réelle, coût IA estimé vs facturation Anthropic réelle.
- **NOT READY** : paiement réel (Stripe non connecté — architecture prête), 9/15 événements du
  funnel produit non câblés (idées/contenu/rapports — voir §2), autres réseaux sociaux que
  LinkedIn, MRR/churn/ARPU/conversion (dépendent tous de Stripe).
