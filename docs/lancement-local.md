# Lancement local

## Développement

```bash
npm run dev
```

Ouvre l'application sur [http://localhost:3000](http://localhost:3000) (Next.js 16, Turbopack).

## Build de production

```bash
npm run build
npm run start
```

## Vérifications avant tout commit

```bash
npm run lint          # ESLint (règles React/hooks strictes, dont set-state-in-effect et refs pendant le rendu)
npx tsc --noEmit       # Vérification TypeScript complète, sans émission de fichiers
npm run build          # Compilation + vérification de toutes les routes
git diff --check       # Erreurs d'espaces blancs
```

Ces quatre commandes sont exécutées systématiquement avant chaque commit de fonctionnalité tout au long du projet — aucun script `test` automatisé n'existe à ce jour (voir [limites-connues.md](./limites-connues.md)).

## Sans variables Supabase

L'application nécessite `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (voir [installation.md](./installation.md)) pour l'authentification et la synchronisation. Sans ces variables, les pages d'authentification et le tableau de bord ne fonctionneront pas correctement.
