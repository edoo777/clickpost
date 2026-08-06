# LinkedIn — État de préparation production (ClickPost)

Document de référence à jour sur l'intégration LinkedIn : ce qui fonctionne réellement, ce qui
attend encore une approbation LinkedIn, les permissions utilisées, la publication personnelle et
sur Page, le planificateur, les limites connues, et les tests à réaliser avant une mise en
production réelle. Complète `docs/linkedin-test-integration.md` (architecture détaillée du
pilote initial) sans le remplacer.

## 1. Ce qui fonctionne réellement aujourd'hui

Confirmé par un test réel complet (premier compte LinkedIn personnel connecté) :

- Connexion OAuth réelle (Authorization Code, échange de code, identité OpenID Connect).
- Stockage chiffré du jeton (AES-256-GCM), RLS sans aucune politique client sur
  `social_connections`.
- Publication réelle sur le profil personnel : texte, texte + image, plusieurs images.
- Identifiant de post réel enregistré (`PublishAttempt.externalPostId`) et lien direct affiché
  ("Voir sur LinkedIn ↗") sur la fiche publication.
- Publication immédiate (bouton) **et** programmée (planificateur réel, voir section 6).
- Déconnexion contrôlée (Owner/Admin uniquement), historique de publication conservé.
- Idempotence : un code OAuth n'est échangé qu'une fois (cache en mémoire par code) ; une
  publication déjà publiée avec succès ne peut jamais être republiée (409 `already_published`).
- Isolation par workspace : RLS sur `accounts`/`publications`, `social_connections` accessible
  uniquement via la clé service_role (vérifié en direct : un appel REST anonyme reçoit `42501`
  sur `accounts`/`publications`, `[]` sur `social_connections`).

## 2. Ce qui nécessite encore l'approbation de LinkedIn

| Fonctionnalité | Bloqué par | État dans ClickPost |
|---|---|---|
| Publication sur une Page LinkedIn administrée | Produit LinkedIn "Community Management API" (ou équivalent selon l'offre actuelle) + portées `r_organization_admin`, `w_organization_social`, soumis à revue LinkedIn | Architecture complète et prête, désactivée par `LINKEDIN_ORGANIZATION_ACCESS_ENABLED=false` par défaut — voir section 4. |
| Statistiques réelles (profil personnel) | Portée d'analytics non demandée dans ce pilote | `fetchPublicationMetrics()` renvoie toujours `null`, jamais de donnée inventée. |
| Statistiques réelles (Page LinkedIn) | Portée distincte `r_organization_social`, également soumise à revue, même une fois l'accès Page obtenu | Non implémenté, documenté comme dépendance future dans `stats-provider.ts`. |
| Publication vidéo automatique | Non implémenté dans ClickPost (choix délibéré — pas une limite LinkedIn) | Échec explicite, invite au mode manuel. |
| Rafraîchissement silencieux du jeton | Nécessite l'approbation LinkedIn "Programmatic Refresh Tokens" | Si absent, ClickPost demande une reconnexion complète à l'expiration plutôt que d'inventer un rafraîchissement. |

## 3. Permissions utilisées

- **Portées membre (par défaut, toujours actives une fois configuré)** : `openid`, `profile`,
  `email`, `w_member_social` — authentification, identité minimale, publication en tant que
  membre. Aucune portée supplémentaire demandée sans besoin réel.
- **Portées organisation (Phase 4, opt-in explicite)** : `r_organization_admin` (lister les pages
  administrées), `w_organization_social` (publier en tant que page) — jamais demandées par
  défaut ; uniquement via le lien "Autoriser aussi la publication sur une Page LinkedIn
  administrée" sur un compte déjà connecté, et seulement si `LINKEDIN_ORGANIZATION_ACCESS_ENABLED`
  vaut `true`.

## 4. Publication personnelle

Voir `docs/linkedin-test-integration.md`, sections 4 à 7, pour l'architecture détaillée (flux
OAuth, API Posts, médias). Résumé de ce qui a changé depuis le pilote initial :

- Diagnostic OAuth non sécurisé (client secret, code, corps de réponse complet) entièrement
  retiré. `exchangeCodeForToken()`/`refreshAccessToken()` journalisent en permanence uniquement :
  statut HTTP, catégorie d'erreur standard OAuth, identifiant de corrélation — jamais de secret.
- Le callback est idempotent par code (double requête navigateur ou rechargement de route sans
  double échange) et ne laisse jamais un compte dans un état "connecté" sans jeton stocké avec
  succès.
- Correction d'un bug de fuseau horaire préexistant (non spécifique à LinkedIn) :
  `scheduled_for` est un `timestamptz` Supabase, la date-heure saisie (naïve, champ
  datetime-local) est désormais correctement convertie depuis `timeZone` avant l'envoi, et
  reconvertie à l'affichage après un pull — vérifié par exécution réelle (Toronto, Paris, UTC).

## 5. Publication sur Page LinkedIn (organisation)

Architecture prête, **désactivée par défaut** (`LINKEDIN_ORGANIZATION_ACCESS_ENABLED=false`).
Fonctionnement une fois activé et approuvé par LinkedIn :

1. Un compte personnel déjà connecté peut demander en plus les portées organisation (lien dédié
   sur sa fiche).
2. `GET /api/social/linkedin/organizations?accountId=...` liste les Pages administrées
   (`GET /rest/organizationAcls`, implémenté à partir de la documentation officielle, **non
   testé en conditions réelles** faute d'accès approuvé à ce jour).
3. `POST /api/social/linkedin/connect-organization` crée un compte affilié distinct pour la page
   choisie (même table `accounts`, même flux de publication — `linkedInProvider` est déjà
   agnostique personne/organisation via `externalAccountId`, aucune modification nécessaire côté
   publication réelle une fois le compte créé).
4. La publication en tant que page réutilise le jeton du compte administrateur (LinkedIn ne
   délivre pas de jeton distinct par organisation).

**Pour activer réellement cette fonctionnalité :**
1. Demander le produit LinkedIn adapté (Community Management API ou équivalent actuel) sur
   developer.linkedin.com pour l'application existante.
2. Obtenir l'approbation LinkedIn (revue manuelle, délai variable).
3. Vérifier que `r_organization_admin` et `w_organization_social` apparaissent bien dans les
   portées disponibles de l'app.
4. Mettre `LINKEDIN_ORGANIZATION_ACCESS_ENABLED=true` dans `.env.local` (ou les variables
   d'environnement du déploiement).
5. Tester d'abord avec un seul administrateur/une seule page avant un déploiement large.
6. Revérifier le format exact de la réponse `organizationAcls` à ce moment-là (implémentation
   actuelle non testée en conditions réelles, voir section 2).

## 6. Planificateur

Aucun planificateur n'existait dans le projet avant cette phase. Architecture retenue : **Vercel
Cron → route Next.js → réutilisation directe de `linkedInProvider`** — pas de service externe, pas
de boucle locale permanente (incompatible avec un déploiement serverless).

- **Déclenchement production** : `vercel.json`, toutes les 5 minutes (`*/5 * * * *`). ⚠️ Le palier
  gratuit Vercel limite les Cron Jobs à une exécution quotidienne — sur ce palier, soit accepter
  une latence de publication allant jusqu'à ~24h, soit passer à un palier payant, soit déclencher
  la route depuis un service de cron externe (ex. cron-job.org, GitHub Actions scheduled workflow)
  pointant vers la même URL avec le même en-tête d'autorisation.
- **Authentification** : en-tête `Authorization: Bearer <CRON_SECRET>` — Vercel l'ajoute
  automatiquement à ses propres appels Cron dès que `CRON_SECRET` est défini côté projet Vercel.
  Sans cette variable, la route refuse systématiquement (401), jamais d'exécution non
  authentifiée.
- **Verrouillage** : chaque publication due est réclamée par une mise à jour conditionnelle
  (`status = 'publishing' WHERE status = <statut lu>`) — deux exécutions concurrentes ne peuvent
  jamais traiter la même publication deux fois.
- **Récupération après interruption** : une publication restée en "Publication en cours" plus de
  10 minutes (ex. timeout d'une exécution serverless précédente) redevient candidate.
- **Fuseaux horaires** : gérés via `src/lib/scheduling-time.ts` (voir section 4) — une publication
  programmée "9h" dans le fuseau choisi se déclenche réellement à 9h dans ce fuseau, pas 9h UTC.
- **Politique de nouvelle tentative** : jusqu'à 3 tentatives automatiques (chaque échec non
  permanent repasse la publication à "Programmé", candidate à nouveau au prochain passage —
  l'espacement du déclencheur externe fournit un délai naturel entre tentatives) ; un échec
  permanent (contrainte violée, permission insuffisante, compte non connecté) ou l'épuisement des
  tentatives arrête définitivement les reprises automatiques — jamais de boucle infinie, le mode
  manuel reste disponible ensuite.
- **Déclenchement manuel en local (test)** :
  ```
  curl -X POST http://localhost:3000/api/cron/linkedin-publish \
    -H "Authorization: Bearer <votre CRON_SECRET local>"
  ```
  Nécessite `CRON_SECRET` défini dans `.env.local` et au moins une publication LinkedIn au statut
  "Programmé" avec une date/heure passée.
- **Vérifié réellement** (sans toucher à l'API LinkedIn réelle) : appel direct de la fonction
  contre la base réelle avec zéro candidat (aucune erreur) ; puis avec une ligne de test créée
  temporairement pointant vers un compte non connecté — réclamée, tentative journalisée, échec
  classifié correctement, verrou libéré, ligne de test supprimée après coup.

## 7. Statistiques

Voir `src/lib/linkedin/stats-provider.ts`. Avec les portées actuelles (membre ou organisation),
aucune statistique LinkedIn réelle n'est accessible — `fetchPublicationMetrics()` renvoie
toujours `null`. L'interface distingue clairement (`MetricsSourceBadge`) donnée importée /
démonstration / **"Données non encore disponibles"** (nouveau — remplace un silence ambigu) —
jamais de zéro présenté comme une vraie mesure récupérée.

## 8. Limites connues

- Vidéo non supportée en publication automatique (mode manuel disponible).
- Aucune statistique LinkedIn réelle (personnel ou Page) tant qu'une portée d'analytics n'est pas
  explicitement demandée et approuvée.
- Rafraîchissement de jeton silencieux non garanti sans l'approbation LinkedIn correspondante.
- Palier gratuit Vercel : Cron limité à une exécution quotidienne (voir section 6).
- Publication sur Page LinkedIn : implémentée mais non testée en conditions réelles (aucun accès
  approuvé à ce jour) — à revérifier avant toute activation.
- Isolation entre deux workspaces réels : vérifiée par architecture (RLS) et par un appel REST
  anonyme, **non testée avec deux comptes utilisateurs réels distincts** dans le cadre de cette
  session (aucun second compte disponible) — recommandé avant une mise en production multi-tenant
  réelle.

## 9. Tests à réaliser avant production

Déjà vérifiés dans cette session (voir le rapport final pour le détail) :
- [x] Connexion OAuth réelle bout en bout (un compte personnel).
- [x] Publication texte et image réelles.
- [x] Aucune fuite de secret dans les logs (recherche exhaustive de `console.*`).
- [x] RLS/isolation structurelle (appels REST anonymes).
- [x] Fuseaux horaires (conversion réelle vérifiée par exécution).
- [x] Verrouillage et récupération du planificateur (test réel avec une ligne jetable).
- [x] `npx tsc --noEmit`, `npm run lint`, `npm run build`, `git diff --check` après chaque phase.

Restent à faire avant une mise en production réelle (nécessitent un navigateur et/ou un second
compte, non disponibles dans cet environnement) :
- [ ] Test manuel complet dans un navigateur réel : reconnexion, déconnexion, jeton expiré
  (attendre l'expiration ou révoquer manuellement côté LinkedIn), nouvelle tentative après échec.
- [ ] Vérification visuelle des modes clair/sombre sur les nouveaux composants LinkedIn
  (`LinkedInConnectionPanel`, `LinkedInOrganizationsPanel`, `LinkedInPublishAction` — classes
  `dark:` déjà présentes dans le code, non vérifiées visuellement).
- [ ] Vérification mobile réelle (responsive déjà hérité des composants existants, non testé sur
  appareil réel).
- [ ] Navigation clavier réelle (tous les contrôles sont des `<button>`/`<a>` natifs, focusables
  par défaut — non testée avec un lecteur d'écran ou une navigation clavier exhaustive réelle).
- [ ] Isolation entre deux workspaces avec deux comptes utilisateurs réels distincts.
- [ ] Première exécution réelle du planificateur en production (Vercel Cron) avec une vraie
  publication programmée.
- [ ] Test de charge raisonnable avant un déploiement à grande échelle (volume de publications
  simultanées géré par le planificateur).

## 10. Rollback rapide

Voir `docs/linkedin-test-integration.md`, section rollback (toujours valide) : retirer une seule
variable serveur suffit à désactiver proprement l'ensemble de l'intégration LinkedIn, sans perte
de données ; le mode manuel reste disponible pour toute publication LinkedIn dans tous les cas.
