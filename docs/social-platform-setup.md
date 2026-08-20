# Configuration des plateformes sociales — ClickPost

**LinkedIn, Instagram, Facebook, TikTok, X et YouTube disposent désormais chacun d'une
intégration API réelle, complète côté code** — OAuth, callback, stockage chiffré des jetons,
rafraîchissement, récupération du profil/de la page/du compte, publication texte/image/vidéo
selon ce que chaque plateforme permet réellement, gestion d'erreurs honnête, reconnexion,
déconnexion, statuts de connexion, journaux sans secret, tests unitaires. **Aucune n'est
opérationnelle sans vos propres identifiants** (compte développeur, application enregistrée,
variables d'environnement) — c'est volontaire : ClickPost n'affiche jamais un envoi automatique
qui n'a pas réellement eu lieu, et le code ne peut pas fonctionner sans un compte développeur que
vous seul pouvez créer. Ce document explique l'architecture en place et la procédure exacte pour
activer chaque plateforme, une fois vos identifiants en main.

Threads, Pinterest et "Autre" restent sans fournisseur réel (interface uniquement) — hors
périmètre de ce chantier.

## Architecture

- **Abstraction commune (Social Provider / Adapter)** : `src/types/publishing-provider.ts`
  (interface `PublishProvider`) et `src/lib/publishing/providers.ts` (registre par plateforme,
  `getPublishProvider(platform)`). Les six plateformes ci-dessus ont chacune un fournisseur réel
  branché ; `isConfigured()` reflète les identifiants réellement présents côté serveur pour
  chacune — jamais une valeur optimiste par défaut. Aucun composant, route ou planificateur ne
  connaît les particularités d'une plateforme donnée.
- **Couche partagée `src/lib/social/`** (générique, indépendante de toute plateforme) :
  - `workspace-guard.ts` — connecter/déconnecter un compte reste réservé aux Owner/Admin du
    workspace.
  - `callback-idempotency.ts` — un code d'autorisation déjà traité une fois renvoie le même
    résultat sans second appel réseau (utile en développement : rechargement, double requête).
  - `connections.ts` — lecture/écriture chiffrée de `social_connections` (AES-256-GCM, voir
    `src/lib/oauth/token-encryption.ts`) et logique commune de rafraîchissement automatique du
    jeton (`getValidAccessToken`), paramétrée par la fonction de rafraîchissement propre à
    chaque plateforme.
  - `media.ts` — téléchargement d'un média déjà stocké dans `publication-media`
    (`downloadPublicationMedia`, pour un envoi direct d'octets — LinkedIn, TikTok, X, YouTube) ou
    URL signée temporaire (`getSignedPublicationMediaUrl`, pour les plateformes qui récupèrent
    elles-mêmes le fichier — Instagram, Facebook).
  - `connection-state.ts` — dérive l'état de connexion détaillé affiché (`OAuthConnectionState`)
    à partir de faits vérifiables uniquement.

  LinkedIn garde ses propres copies historiques de ces modules (`src/lib/linkedin/*`), jamais
  modifiées ni redirigées vers la couche partagée, pour ne courir aucun risque de régression sur
  la seule intégration déjà en production au moment de ce chantier.
- **Meta partagé** (`src/lib/meta/`) : Instagram et Facebook utilisent une seule et même
  application Meta (`config.ts`), le même flux OAuth (`oauth.ts`, jeton utilisateur longue durée
  ~60 jours, pas de jeton de rafraîchissement séparé — voir la note dans ce fichier) et les mêmes
  appels Graph API de base (`client.ts`, `callback.ts`). C'est ainsi que Meta conçoit réellement
  son API : un compte professionnel Instagram n'est accessible qu'à travers la Page Facebook à
  laquelle il est lié.
- **Colonne `accounts.platform_metadata`** (migration `20260820000000`) : métadonnées propres à
  une plateforme sans justifier une colonne dédiée — utilisée aujourd'hui pour mémoriser la Page
  Facebook liée à un compte Instagram (nécessaire pour rafraîchir son jeton). Jamais un secret.
- **Contraintes par plateforme** : `src/lib/publishing/platform-constraints.ts`, inchangé.
- **Publication manuelle** : `src/components/publications/ManualPublishPanel.tsx`, inchangé —
  reste la voie de repli pour toute plateforme non configurée ou toute limite non couverte
  ci-dessous (ex. vidéo LinkedIn).
- **Interface utilisateur** : **non modifiée par ce chantier.** Seul le code serveur (OAuth,
  callback, stockage, publication) a été construit, à l'identique de la demande initiale
  (provider/adapter, OAuth start, callback, stockage, refresh, profil, publication, erreurs,
  reconnexion, déconnexion, statuts, journaux, tests). `src/components/accounts/
  LinkedInConnectionPanel.tsx` reste pour l'instant le seul panneau de connexion affiché dans
  l'interface (`/comptes`) — brancher un bouton « Connecter Instagram/Facebook/TikTok/X/YouTube »
  équivalent, pointant vers `/api/social/<plateforme>/connect?brandId=...`, reste à faire
  séparément avant qu'un utilisateur puisse initier ces connexions depuis l'interface. Les routes
  serveur sont entièrement fonctionnelles et testables dès aujourd'hui (ex. via un lien direct ou
  un outil comme curl/Postman une fois les identifiants configurés).

## Pour activer chaque plateforme

### Instagram et Facebook (Meta)

1. Créer une application sur [developers.facebook.com](https://developers.facebook.com/) (une
   seule application couvre les deux produits).
2. Ajouter les produits **"Facebook Login for Business"** (OAuth) et activer l'accès à
   l'**Instagram Graph API** dans les paramètres de l'app.
3. Dans les paramètres OAuth de l'app, ajouter EXACTEMENT ces deux URLs de redirection (une par
   produit, caractère pour caractère) :
   - `https://votre-domaine.com/api/social/instagram/callback`
   - `https://votre-domaine.com/api/social/facebook/callback`
4. Renseigner dans `.env.local` : `META_CLIENT_ID`, `META_CLIENT_SECRET`, `META_API_VERSION`
   (ex. `v21.0`), `META_INSTAGRAM_REDIRECT_URI`, `META_FACEBOOK_REDIRECT_URI`.
5. **Revue Meta obligatoire avant production** : en mode développement, l'app ne peut publier que
   pour les comptes explicitement ajoutés comme testeurs/développeurs de l'app (Rôles → Ajouter
   des personnes). Pour publier pour n'importe quel client, Meta doit approuver les permissions
   `pages_manage_posts`, `instagram_content_publish`, `instagram_basic`, `pages_show_list`,
   `pages_read_engagement` via l'App Review (fournir une vidéo de démonstration du flux de
   connexion et de publication).
6. Prérequis côté compte Instagram : doit être un compte **professionnel ou créateur**, lié à une
   **Page Facebook** (jamais un compte personnel — l'API ne le permet pas).
7. Limite connue : la publication Instagram/Facebook envoie l'URL signée temporaire du média à
   Meta (qui va lui-même la récupérer) plutôt que d'envoyer les octets directement — le média doit
   donc rester accessible le temps que Meta le récupère (quelques minutes, voir
   `src/lib/social/media.ts`).

### TikTok

1. Créer une application sur [developers.tiktok.com](https://developers.tiktok.com/) avec les
   produits **"Login Kit"** et **"Content Posting API"**.
2. Ajouter l'URL de redirection : `https://votre-domaine.com/api/social/tiktok/callback`.
3. Renseigner `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_REDIRECT_URI`.
4. **Audit TikTok obligatoire pour publier publiquement** : tant que l'application n'a pas été
   auditée et approuvée par TikTok pour `video.publish`, toute vidéo envoyée via l'API est
   automatiquement redirigée vers la boîte de réception privée du créateur (jamais publiée
   publiquement, quel que soit le succès de l'appel API) — ClickPost le détecte et le signale
   explicitement (voir `src/lib/tiktok/provider.ts`), jamais présenté comme un succès de
   publication publique.
5. Limite : vidéo uniquement (TikTok ne permet pas de publication texte seul ou image via cette
   API dans la configuration actuelle).

### X

1. Créer une application sur [developer.x.com](https://developer.x.com/) avec un niveau d'accès
   permettant la **publication programmatique** (le niveau gratuit actuel de l'API X ne permet
   généralement pas d'écrire des tweets — vérifier l'offre en vigueur au moment de l'activation).
2. Activer **OAuth 2.0** dans les paramètres de l'app (type de client confidentiel), ajouter
   l'URL de redirection : `https://votre-domaine.com/api/social/x/callback`.
3. Renseigner `X_CLIENT_ID`, `X_CLIENT_SECRET`, `X_REDIRECT_URI`.
4. Portée `offline.access` demandée automatiquement — nécessaire pour obtenir un jeton de
   rafraîchissement ; sans elle, le jeton d'accès (durée de vie ~2 heures) ne pourrait jamais être
   renouvelé silencieusement.
5. Limite connue : le téléversement de média (`src/lib/x/client.ts`) envoie le fichier en un seul
   segment plutôt qu'un vrai découpage multi-segments — suffisant pour une image ou une courte
   vidéo (jusqu'à 5 Mo), jamais utilisé au-delà (échec explicite, jamais une troncature
   silencieuse).

### YouTube

1. Sur [console.cloud.google.com](https://console.cloud.google.com/) (même projet que
   `YOUTUBE_API_KEY` si déjà utilisé pour `/tendances`, ou un projet dédié) : activer **"YouTube
   Data API v3"**, configurer l'**écran de consentement OAuth**, puis créer des identifiants
   **OAuth 2.0 — Application Web**.
2. Ajouter l'URI de redirection autorisée :
   `https://votre-domaine.com/api/social/youtube/callback`.
3. Renseigner `YOUTUBE_OAUTH_CLIENT_ID`, `YOUTUBE_OAUTH_CLIENT_SECRET`,
   `YOUTUBE_OAUTH_REDIRECT_URI` — distincts de `YOUTUBE_API_KEY` (clé simple en lecture seule,
   sans rapport avec cette intégration OAuth).
4. **Écran de consentement en mode "Test" ou "Production"** : en mode Test, seuls les comptes
   Google explicitement ajoutés comme testeurs peuvent se connecter ; passer en Production
   nécessite une vérification Google si l'app demande des scopes sensibles (`youtube.upload` en
   fait partie) — prévoir ce délai avant une mise à disposition à des utilisateurs externes.
5. `YOUTUBE_DEFAULT_PRIVACY_STATUS=private` par défaut — les vidéos téléversées automatiquement
   restent privées tant que vous ne changez pas explicitement cette variable
   (`unlisted`/`public`), le temps de vérifier manuellement le comportement de l'intégration.
6. Limite : vidéo uniquement, un seul envoi complet (pas de reprise sur coupure réseau en cours de
   transfert).

## Toutes les plateformes — commun

- **Chiffrement et stockage** : les cinq nouvelles intégrations réutilisent
  `TOKEN_ENCRYPTION_KEY` et `SUPABASE_SERVICE_ROLE_KEY` déjà définies pour LinkedIn (même
  mécanisme, même table `social_connections`, déjà générique par plateforme) — aucune nouvelle
  variable de chiffrement à créer.
- **Jamais de simulation** : sans les variables d'une plateforme, `isConfigured()` renvoie
  `false`, `/api/social/<plateforme>/connect` redirige vers `/comptes?<plateforme>_error=not_configured`,
  et toute tentative de publication échoue explicitement (`isPermanent: true`) — jamais un succès
  fabriqué, jamais un blocage du reste de l'application.
- **Journaux** : chaque échec d'échange OAuth est journalisé côté serveur avec un identifiant de
  corrélation, un code HTTP et une catégorie d'erreur standard — jamais le code d'autorisation, le
  secret client, ni le jeton lui-même.

## Résumé — ce qu'il reste à fournir, par plateforme

| Plateforme | Compte développeur | Application | Revue/audit externe requis pour la production |
|---|---|---|---|
| Instagram | developers.facebook.com | Une Meta App (partagée avec Facebook) | Oui — App Review Meta (`instagram_content_publish` etc.) |
| Facebook | developers.facebook.com | La même Meta App | Oui — App Review Meta (`pages_manage_posts` etc.) |
| TikTok | developers.tiktok.com | App avec "Content Posting API" | Oui — audit TikTok pour publier publiquement (sinon brouillon privé uniquement) |
| X | developer.x.com | App avec niveau d'accès payant | Accès payant à la publication programmatique (pas de "revue" à proprement parler) |
| YouTube | console.cloud.google.com | Identifiants OAuth2 Web | Oui — vérification Google si l'app sort du mode "Test" (scope `youtube.upload` sensible) |

Chaque ligne du tableau ci-dessus est un prérequis externe que ClickPost ne peut pas contourner
ni accélérer — le code est prêt à fonctionner dès que ces éléments sont fournis.
