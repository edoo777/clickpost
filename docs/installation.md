# Installation

## Prérequis

- Node.js 20 ou supérieur.
- Un projet Supabase (voir [migrations.md](./migrations.md) pour le lier).
- Le CLI Supabase n'a pas besoin d'être installé globalement — il est appelé via `npx supabase`.

## Étapes

1. Cloner le dépôt et installer les dépendances :

   ```bash
   npm install
   ```

2. Copier `.env.example` vers `.env.local` (jamais commité — déjà dans `.gitignore`) et renseigner :
   - `NEXT_PUBLIC_SUPABASE_URL` — URL du projet (Project Settings → API → Project URL).
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — clé publique `anon`/`publishable` (Project Settings → API → Project API keys).

   **Ne jamais** renseigner ou exposer la clé `service_role` dans un fichier lu par le navigateur.

3. Dans le tableau de bord Supabase (Authentication → Providers), activer le fournisseur **Email** (mot de passe).

4. Configurer **Site URL** et **Redirect URLs** (Authentication → URL Configuration) — nécessaire pour que les liens de confirmation d'e-mail et de réinitialisation de mot de passe pointent vers la bonne origine (`localhost:3000` en développement, votre domaine en production).

5. Lier le projet et appliquer les migrations — voir [migrations.md](./migrations.md).

6. Lancer l'application — voir [lancement-local.md](./lancement-local.md).

## Bucket Storage

Un bucket public `avatars` est nécessaire (créé par les migrations F1.3) pour les photos de profil. Il est servi par URL directe, sans politique de listage — voir [modele-donnees.md](./modele-donnees.md).
