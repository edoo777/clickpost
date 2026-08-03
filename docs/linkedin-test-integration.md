# Intégration LinkedIn réelle (plateforme pilote) — ClickPost

LinkedIn est la première plateforme sociale de ClickPost à disposer d'une intégration API réelle
(OAuth, publication, statut). Ce document décrit l'architecture mise en place, les variables à
fournir, le flux OAuth, la publication, les médias, la programmation, les statistiques, les
limites connues, les tests effectués, et les procédures de connexion réelle / déconnexion /
retour en arrière.

## 1. Architecture

Aucun second système n'a été créé : l'intégration LinkedIn réutilise entièrement l'architecture
existante (marques, comptes, `PublishProvider`, publications, médias, permissions de workspace).

- **Comptes** (`accounts`, `src/types/dashboard.ts`) : un compte LinkedIn est un `SocialAccount`
  comme les autres, avec des champs additionnels optionnels et additifs :
  `externalAccountId`, `oauthScopes`, `tokenExpiresAt`, `lastCheckedAt`. `AccountStatus` gagne la
  valeur `insufficient_permission`.
- **Connexions OAuth** (`social_connections`, nouvelle table) : jetons chiffrés uniquement,
  jamais exposés côté client — voir section 9 (sécurité).
- **Fournisseur de publication** (`src/lib/linkedin/provider.ts`, `linkedInProvider`) : implémente
  l'interface `PublishProvider` (`src/types/publishing-provider.ts`) exactement comme prévu par
  l'architecture existante, mais n'est **jamais** enregistré dans le registre partagé
  `src/lib/publishing/providers.ts` (qui reste client-safe et inchangé) — les routes serveur
  LinkedIn l'importent directement (voir section 5).
- **État de connexion** (`src/lib/linkedin/connection-state.ts`) : dérive un état détaillé
  (`OAuthConnectionState`, 10 valeurs) à partir de faits déjà connus du compte, jamais d'un état
  optimiste par défaut.
- **Mode manuel préservé** : `ManualPublishPanel.tsx` reste entièrement inchangé dans son
  fonctionnement et disponible pour LinkedIn si le compte n'est pas connecté ou si une permission
  manque. `LinkedInPublishAction.tsx` est un composant strictement additif, visible uniquement
  quand un compte LinkedIn est réellement `connected`.

## 2. Variables d'environnement (`.env.local`)

Toutes ces variables sont strictement serveur (jamais `NEXT_PUBLIC_`). Voir `.env.example` pour le
gabarit à jour.

| Variable | Rôle |
|---|---|
| `LINKEDIN_CLIENT_ID` | Identifiant de l'application LinkedIn. |
| `LINKEDIN_CLIENT_SECRET` | Secret de l'application — jamais journalisé, jamais renvoyé au navigateur. |
| `LINKEDIN_REDIRECT_URI` | URL de redirection OAuth exacte, doit correspondre caractère pour caractère à celle enregistrée côté LinkedIn. |
| `LINKEDIN_API_VERSION` | Version d'API LinkedIn (format `AAAAMM`), envoyée dans l'en-tête `LinkedIn-Version`. |
| `TOKEN_ENCRYPTION_KEY` | Clé AES-256-GCM (32 octets base64) pour le chiffrement applicatif des jetons stockés. |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service_role Supabase, utilisée uniquement par les routes serveur LinkedIn pour lire/écrire `social_connections`. |

`isLinkedInOAuthConfigured()` (`src/lib/linkedin/config.ts`) exige les trois groupes
(identifiants LinkedIn + chiffrement + service_role) simultanément — jamais un « presque
configuré ». Sans cela, l'intégration reste désactivée et ClickPost fonctionne exactement comme
avant.

## 3. Permissions demandées (portées)

`LINKEDIN_MEMBER_SCOPES` (`src/lib/linkedin/config.ts`) : `openid`, `profile`, `email`,
`w_member_social`. Aucune portée d'organisation ni d'analytics n'est demandée — l'architecture
détecte les rôles admin d'organisation pour préparer un futur support des Pages Entreprise, mais
ne bloque jamais le test personnel sur l'absence de ces permissions.

Si une portée nécessaire manque (accordée partiellement par LinkedIn, ou révision LinkedIn non
obtenue) : le compte passe à `insufficient_permission`, seule la fonctionnalité concernée est
désactivée, les autres restent disponibles, et aucune autorisation réussie n'est jamais simulée.

## 4. Flux OAuth

1. `GET /api/social/linkedin/connect?brandId=...` — vérifie la session, vérifie
   `isLinkedInOAuthConfigured()`, vérifie que l'utilisateur est Owner/Admin du workspace
   (`isWorkspaceAdmin`), construit une URL d'autorisation LinkedIn avec un `state` signé HMAC
   (CSRF, 10 minutes de validité, aucune table dédiée) et redirige.
2. LinkedIn redirige vers `GET /api/social/linkedin/callback` avec `code` et `state`.
3. Le callback vérifie la signature et l'expiration du `state`, re-vérifie que l'utilisateur de la
   session correspond à celui du `state` et qu'il est toujours Owner/Admin (défense contre un
   détournement de callback), échange le `code` contre un jeton, récupère l'identité minimale
   (OpenID Connect `userinfo`), met à jour ou crée le compte, chiffre et enregistre le jeton, puis
   redirige vers `/comptes?linkedin_connected=<accountId>` (ou `?linkedin_error=<raison>` en cas
   d'échec — jamais un crash brut).
4. `POST /api/social/linkedin/disconnect` (Owner/Admin uniquement) supprime la connexion chiffrée
   et repasse le compte à `profile_only` — l'historique de publication est conservé, le compte
   n'est jamais supprimé.
5. `GET /api/social/linkedin/status?accountId=...` renvoie l'état de connexion calculé
   (`OAuthConnectionSummary`) — jamais un jeton.

Aucun secret ni jeton n'est jamais journalisé (vérifié : zéro appel `console.*` dans
`src/lib/linkedin/**` et `src/app/api/social/**`) ni stocké en dehors de `social_connections`
(chiffré, RLS sans aucune politique pour `authenticated`/`anon` — voir section 9).

## 5. Publication (API Posts actuelle)

`src/lib/linkedin/client.ts` utilise exclusivement l'API Posts actuelle
(`POST https://api.linkedin.com/rest/posts`), jamais l'ancienne API `ugcPosts` (dépréciée),
avec les en-têtes officiels (`Authorization: Bearer`, `LinkedIn-Version`,
`X-Restli-Protocol-Version: 2.0.0`). L'identifiant du post créé est lu depuis l'en-tête de
réponse `x-restli-id` (jamais dans le corps JSON) — si cet en-tête est absent, l'échec est
explicite, aucun identifiant n'est jamais fabriqué.

Support progressif implémenté : texte seul, texte + URL (un seul lien natif), une image, plusieurs
images (`content.multiImage.images[]`). **La vidéo n'est pas implémentée** — une publication vidéo
échoue explicitement avec un message invitant à publier manuellement, plutôt qu'un code non testé.

`POST /api/social/linkedin/publish` (`{publicationId}`) :
1. Vérifie la session et récupère la publication + le compte.
2. **Idempotence** : refuse (409 `already_published`) si la publication est déjà `published` ou
   si une tentative précédente a déjà `status: "success"` — empêche toute double publication
   (double clic, nouvel essai après coupure réseau côté client alors que le serveur avait déjà
   réussi).
3. Appelle `linkedInProvider.publish()`, qui valide les contraintes de plateforme, refuse
   explicitement une publication vidéo, obtient un jeton valide (rafraîchi si besoin), téléverse
   les médias, crée le post, et retourne le résultat détaillé.
4. Enregistre systématiquement la tentative dans `publication.publishAttempts` (mode
   `automatic`), et ne fait passer le statut à `published` que si LinkedIn a confirmé un
   identifiant réel.

États minimaux couverts (`PublishAttempt.status`, `AccountStatus`, `OAuthConnectionState`
combinés) : Prêt, Programmé, Publication en cours, Publié, Échec temporaire, Échec permanent,
Permission insuffisante, Autorisation expirée, Action manuelle requise.

## 6. Médias

`src/lib/linkedin/media.ts` télécharge le fichier déjà stocké dans ClickPost via le client
service_role Storage (`.download()`, pas une URL signée — reste valide même sans session
utilisateur active, utile pour un futur job de fond). Pour chaque image : initialisation du
téléversement LinkedIn (`initializeImageUpload`), envoi des octets (`uploadImageBytes`),
récupération de l'URN LinkedIn, puis utilisation de cet URN dans la création du post. Un échec à
n'importe quelle étape est explicite ; aucune publication locale n'est laissée dans un faux état
final. Aucune URL signée expirée n'est jamais transmise comme si elle était permanente.

## 7. Programmation

La programmation reste entièrement gérée par ClickPost (aucune promesse que LinkedIn la
conserverait lui-même). `POST /api/social/linkedin/publish` fournit une `idempotencyKey`
(`{publicationId}:{attemptId}`) au fournisseur ; combinée à la vérification de statut `success`
existant côté route, elle empêche une double publication même en cas de rejeu. **Aucun
planificateur de tâches de fond n'existe encore dans ce projet** — cette route n'est aujourd'hui
déclenchée que par une action explicite (bouton « Publier via LinkedIn »). Un futur job de
programmation devra, à l'heure prévue : revérifier la connexion du compte, le statut du jeton, les
permissions, valider le contenu, lancer une seule tentative active, puis réutiliser cette même
route/logique.

## 8. Statistiques

`src/lib/linkedin/stats-provider.ts` : avec les portées minimales demandées (`openid profile
email w_member_social`), les API d'analytics/reporting LinkedIn sont structurellement
inaccessibles. `fetchPublicationMetrics()` renvoie donc toujours `null` — jamais zéro traité comme
une statistique récupérée, jamais de donnée fictive. L'interface doit afficher « Permission
LinkedIn requise » et conserver l'import CSV / la saisie manuelle déjà existants. Les statistiques
LinkedIn réelles nécessiteraient une portée d'analytics supplémentaire et une revue LinkedIn
distincte, non demandée dans ce pilote (« ne réclame pas de permissions inutiles »).

## 9. Sécurité et RLS

- **`social_connections`** : RLS activée, **aucune politique créée** pour `authenticated`/`anon`
  — ces rôles n'obtiennent jamais aucune ligne, quel que soit le workspace ou le rôle applicatif.
  Seul le client `service_role` (routes serveur LinkedIn uniquement,
  `src/lib/supabase/service-role.ts`) peut lire/écrire cette table. Vérifié en direct via un appel
  REST non authentifié (clé anon) confirmant `200 []`.
- **Chiffrement applicatif** (`src/lib/oauth/token-encryption.ts`) : AES-256-GCM en défense
  supplémentaire, même en cas de compromission de la seule clé service_role.
- **Connexion/déconnexion réservées à Owner/Admin** (`isWorkspaceAdmin`,
  `src/lib/linkedin/workspace-guard.ts`) — vérification applicative additionnelle, jamais un
  assouplissement de la RLS existante des autres tables.
- **`state` OAuth signé HMAC** (CSRF) avec re-vérification de l'utilisateur et de son rôle au
  callback — empêche un détournement de callback (state valide mais rejoué par un autre
  utilisateur, ou droits perdus entre le clic et le retour LinkedIn).
- **Jamais de jeton renvoyé au client** : `/api/social/linkedin/status` ne renvoie qu'un résumé
  d'état calculé.
- **Isolation de workspace** : toutes les requêtes passent par le client Supabase authentifié de
  l'utilisateur (RLS standard) sauf l'accès direct à `social_connections`, volontairement
  restreint au service_role et jamais atteignable autrement.
- **Migration additive et idempotente** (`supabase/migrations/20260803194148_linkedin_oauth_connections.sql`)
  : uniquement des `add column if not exists` / nouvelle table, aucune suppression de donnée,
  vérifiée par `db push --dry-run` avant et après application.

## 10. Mode manuel

`ManualPublishPanel.tsx` reste disponible pour toute publication LinkedIn tant que le compte n'est
pas `connected` ou qu'une permission manque — copie du texte, téléchargement des médias,
confirmation humaine explicite. `LinkedInPublishAction.tsx` (publication réelle par API) et
`ManualPublishPanel` (publication manuelle) coexistent sur la même publication ; l'historique
distingue clairement les deux (`PublishAttempt.mode`: `automatic` vs `manual`, et le libellé
d'historique « Publiée par API LinkedIn (urn) » vs « Publiée manuellement »).

## 11. Tests effectués (sans identifiants réels)

Aucun identifiant LinkedIn réel n'existe dans cet environnement. Les vérifications suivantes ont
été exécutées réellement (pas seulement lues) :

- **`npx tsc --noEmit`, `npm run lint`, `npm run build`, `git diff --check`** : tous verts après
  chaque groupe de changements.
- **29 scénarios exécutés via Node (fetch simulé, code réel importé, pas de réimplémentation)** :
  génération de l'URL d'autorisation (client_id, redirect_uri, portées exactes, présence du
  `state`) ; validation de `state` valide / falsifié / malformé / expiré ; échange de code refusé
  et réussi ; récupération d'identité réussie et refusée (401) ; publication texte réussie ;
  publication avec une image (`content.media.id`) et plusieurs images
  (`content.multiImage.images[]`) ; échec de création (201 sans `x-restli-id`, jamais d'ID
  fabriqué) ; permission insuffisante (403 classifié `isPermissionError`) ; panne réseau capturée
  proprement ; initialisation et échec de téléversement d'image ; dérivation de l'état de
  connexion pour chaque combinaison de statut de compte, expiration de jeton et portées
  manquantes.
- **Auth-gating live des 5 routes** : serveur de développement démarré, les 5 routes
  (`connect`, `callback`, `status`, `disconnect`, `publish`) interrogées sans session —
  redirection systématique vers `/connexion` par le proxy applicatif (`src/proxy.ts`, protection
  déjà existante de tout le projet), avant même d'atteindre la vérification de session propre à
  chaque route (défense en profondeur confirmée).
- **RLS de `social_connections`** : appel REST direct avec la clé anon confirmant `200 []`
  (aucune ligne visible, aucune politique).
- **Aucune fuite de secret dans les logs** : recherche exhaustive de `console.*` dans
  `src/lib/linkedin/**` et `src/app/api/social/**` — zéro résultat.

Non exécutés dans cette passe (nécessitent soit un vrai compte LinkedIn, soit un environnement de
rendu React non installé dans ce projet) — vérifiés par lecture de code uniquement :
- Le flux OAuth complet avec un vrai compte LinkedIn (section 12 — nécessite votre intervention).
- Les protections anti-double-clic des composants React (`isDisconnecting`, `isPublishing` :
  vérifiées à l'entrée de chaque gestionnaire, mais non exercées par un test de rendu automatisé,
  aucun framework de test n'étant installé dans ce projet).
- Un vrai job de programmation en tâche de fond (n'existe pas encore dans ce projet, voir section
  7).

## 12. Connexion réelle — procédure

1. Aller sur https://www.linkedin.com/developers/apps et créer une application.
2. Sélectionner le produit **« Share on LinkedIn »** (et, si disponible pour votre compte,
   **« Sign In with LinkedIn using OpenID Connect »** pour l'identité) — pas de produit
   Marketing/Analytics, non nécessaire pour ce pilote.
3. Renseigner : nom de l'app, logo, page LinkedIn associée (une page personnelle ou d'entreprise
   est exigée par LinkedIn pour créer une app, même pour un test sur compte personnel), URL de
   confidentialité.
4. Dans Auth → **Authorized redirect URLs for your app**, ajouter exactement :
   `http://localhost:3000/api/social/linkedin/callback`
5. Vérifier dans Products/Auth que les portées suivantes sont bien accordées à l'app :
   `openid`, `profile`, `email`, `w_member_social`.
6. Dans `.env.local` (jamais dans le chat), ajouter les 6 variables de la section 2 :
   `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` (Auth → Application credentials),
   `LINKEDIN_REDIRECT_URI` (l'URL de l'étape 4), `LINKEDIN_API_VERSION` (version actuelle au
   format AAAAMM, voir https://learn.microsoft.com/en-us/linkedin/marketing/versioning),
   `TOKEN_ENCRYPTION_KEY` (générer avec
   `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`),
   `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API du projet Supabase déjà utilisé).
7. Redémarrer `npm run dev`, aller sur `/comptes`, ouvrir un compte LinkedIn existant (ou en créer
   un via « + Ajouter un compte », plateforme LinkedIn) rattaché à une marque, cliquer
   « Connecter LinkedIn », autoriser sur LinkedIn.
8. Pour un compte personnel : rien de plus n'est requis, le test peut démarrer dès l'étape 7.
9. Pour une Page Entreprise (hors périmètre du premier test, architecture déjà préparée mais non
   activée) : il faudra un produit LinkedIn additionnel (« Community Management API » ou
   équivalent selon l'offre actuelle), une revue LinkedIn de l'app, et des portées d'organisation
   supplémentaires (`w_organization_social`, etc.) — à ajouter uniquement quand ce cas d'usage sera
   réellement utilisé.
10. Test : créer une publication LinkedIn en statut « Programmé », vérifier que le bouton
    « Publier via LinkedIn » apparaît (compte `connected`), publier, vérifier dans LinkedIn que le
    post existe réellement, vérifier que ClickPost affiche l'identifiant réel obtenu.

## Déconnexion

Bouton « Déconnecter » dans le panneau de connexion LinkedIn (`/comptes`, fiche du compte) —
Owner/Admin uniquement. Supprime la ligne `social_connections` (jeton chiffré) et repasse le
compte à `profile_only`. L'historique de publications (`publishAttempts`) n'est jamais supprimé.

## Retour en arrière (rollback)

- **Désactivation immédiate sans rien supprimer** : retirer une seule des variables serveur
  (par exemple `LINKEDIN_CLIENT_ID` ou `SUPABASE_SERVICE_ROLE_KEY`) suffit à faire repasser
  `isLinkedInOAuthConfigured()` à `false` — l'intégration entière se désactive proprement
  (connexion impossible, statut « non configuré »), le mode manuel reste disponible.
- **Retrait du code** : tous les fichiers ajoutés sont additifs et isolés
  (`src/lib/linkedin/**`, `src/lib/oauth/**`, `src/app/api/social/linkedin/**`,
  `LinkedInConnectionPanel.tsx`, `LinkedInPublishAction.tsx`) ; les modifications aux fichiers
  existants sont toutes des ajouts de champs optionnels ou de branches conditionnelles, jamais un
  remplacement du comportement existant.
- **Base de données** : la migration n'ajoute que des colonnes optionnelles et une nouvelle table
  — un rollback ne nécessite aucune suppression de données existantes ; supprimer la table
  `social_connections` (si jamais nécessaire) n'affecte aucune autre table.
