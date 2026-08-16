# ClickPost — Guide de l'espace Admin

Ce document décrit l'espace `/admin`, réservé à l'administrateur de la plateforme ClickPost
(distinct du rôle « admin/owner » d'un workspace, qui reste géré normalement dans
`workspace_members`).

## 1. Accès

L'accès est contrôlé par une liste d'e-mails, jamais par un rôle stocké en base ni une politique
RLS :

- Variable serveur `ADMIN_EMAILS` (`.env.local`, jamais commitée) — une ou plusieurs adresses
  séparées par des virgules.
- Sans cette variable, `/admin` est inaccessible à tout le monde, y compris au propriétaire du
  workspace.
- Vérifiée à deux niveaux indépendants (défense en profondeur) :
  1. `src/proxy.ts` (middleware) — redirige vers `/` si l'e-mail de l'utilisateur connecté n'est
     pas dans la liste.
  2. `src/app/admin/layout.tsx` (Server Component) — revérifie indépendamment côté serveur avant
     de rendre quoi que ce soit.
- Chaque route `/api/admin/**` revérifie une troisième fois via `requirePlatformAdmin()`
  (`src/lib/admin/require-admin.ts`) avant d'écrire quoi que ce soit.

**Pour donner l'accès à quelqu'un** : ajouter son adresse e-mail à `ADMIN_EMAILS` dans
`.env.local` (local) ou dans les variables d'environnement de production (à faire vous-même —
cette session n'a pas touché aux clés/variables réelles).

## 2. Sections

### Prompts IA (`/admin/prompts`)

Un complément de texte par fonction IA (Copilote, Atelier, Générateur de sujets, Rapports),
**toujours ajouté à la fin du prompt système existant** — jamais un remplacement. Les règles de
sécurité codées en dur (interdiction d'inventer une donnée, format de réponse JSON strict) ne sont
jamais exposées à l'édition : seul un texte additionnel est modifiable.

- « Enregistrer » sauvegarde le complément et garde l'ancienne valeur comme marche arrière.
- « Restaurer la version précédente » revient en une étape à la valeur d'avant la dernière
  modification (une seule marche arrière, pas un historique complet — volontairement simple).
- Stocké dans la table `prompt_overrides` (clé = `copilot` | `atelier` | `generateur` | `rapports`).

### Textes produit (`/admin/textes`)

Un ensemble volontairement restreint, pas une administration exhaustive de chaque chaîne de
l'application : aujourd'hui, le titre et le sous-titre d'accueil de l'onboarding (déjà branchés
et affichés réellement — voir `src/app/onboarding/page.tsx`), plus un message « bientôt
disponible » pour un réseau social non connecté (défini, pas encore branché dans une page —
prochaine étape si besoin). Stocké dans `product_texts`, même mécanisme de marche arrière que les
prompts.

Pour ajouter une nouvelle clé : l'ajouter à `PRODUCT_TEXT_DEFAULTS`/`PRODUCT_TEXT_LABELS` dans
`src/lib/admin/product-text-keys.ts`, puis appeler `getProductText("votre_clé")` (server-only,
`src/lib/admin/product-texts.ts`) depuis la page qui doit l'afficher.

### Utilisateurs & workspaces (`/admin/utilisateurs`)

Vue de lecture simple (pas de CRM) : liste des comptes (via `supabase.auth.admin.listUsers()`),
des workspaces et des marques, avec dates de création. Aucune action de modification depuis cette
page.

### Fonctionnalités (`/admin/fonctionnalites`)

Interrupteurs stockés dans `feature_flags`. **Un seul a un effet réel aujourd'hui** :
`gamma_pdf_export`, qui s'ajoute à `GAMMA_API_KEY` (les deux doivent être vrais pour que l'export
PDF Gamma s'active dans Rapports). Les autres (`instagram_integration`, `facebook_integration`,
`tiktok_integration`, `youtube_integration`) sont des réservations pour une activation future :
les basculer aujourd'hui n'active aucune fonctionnalité, car l'intégration elle-même n'existe pas
encore dans le code.

## 3. Sécurité et architecture

- Aucune des trois tables (`prompt_overrides`, `product_texts`, `feature_flags`) n'a de politique
  RLS d'écriture pour un utilisateur authentifié normal — toute écriture passe par
  `createSupabaseServiceRoleClient()` (`src/lib/supabase/service-role.ts`), uniquement depuis les
  routes `/api/admin/**` déjà gardées par `isPlatformAdminEmail()`.
- Lecture : `prompt_overrides` exige une session authentifiée (les routes IA en ont besoin) ;
  `product_texts`/`feature_flags` sont en lecture publique (ce sont de simples textes/interrupteurs
  d'interface, jamais une donnée sensible).
- Chaque module a été scindé en deux fichiers : un fichier de types/constantes sûr pour les
  composants client (`*-types.ts`/`*-keys.ts`) et un fichier serveur avec la logique de lecture/
  écriture réelle (jamais importé par un composant `"use client"`, car il dépend de
  `next/headers`).
- Aucune clé/secret n'est jamais loggé ni affiché depuis le code de l'espace Admin.

## 4. Limites connues

- Pas d'historique complet des modifications de prompts/textes (une seule marche arrière).
- La page Utilisateurs ne permet aucune action (désactivation de compte, changement de rôle...).
- `coming_soon_other_networks` (texte produit) est défini mais pas encore affiché dans une page
  réelle de l'application.
