# Migrations Supabase

## Procédure

Toutes les migrations sont versionnées dans `supabase/migrations/` et appliquées via le CLI Supabase (`npx supabase`, aucune installation globale requise).

1. **Connexion** (une seule fois, token personnel généré depuis le tableau de bord Supabase — jamais collé dans un terminal partagé) :

   ```bash
   npx supabase login
   ```

   Si l'environnement ne supporte pas le flux interactif, générer un jeton d'accès personnel dans le tableau de bord Supabase et l'exporter comme variable d'environnement `SUPABASE_ACCESS_TOKEN` dans un terminal indépendant avant de relancer les commandes CLI.

2. **Lier le projet local au projet Supabase distant** :

   ```bash
   npx supabase link --project-ref <ref-du-projet>
   ```

3. **Toujours vérifier avant d'appliquer** — `db push --dry-run` liste les migrations qui seraient appliquées, sans écrire quoi que ce soit :

   ```bash
   npx supabase db push --dry-run
   ```

4. **Appliquer réellement**, seulement après revue du dry-run :

   ```bash
   npx supabase db push
   ```

5. **Vérifier la synchronisation locale/distante** à tout moment :

   ```bash
   npx supabase migration list
   ```

## Créer une nouvelle migration

```bash
npx supabase migration new <nom_descriptif>
```

Les migrations sont **additives uniquement** — jamais de modification d'un fichier déjà appliqué. Toute évolution de schéma passe par un nouveau fichier.

## Migrations appliquées (8, toutes en phase local/distant)

| Fichier | Objet |
|---|---|
| `20260729003507_f1_1_foundations.sql` | Tables `profiles`, `workspaces`, `workspace_members` + RLS de base, fonctions `is_workspace_member`/`is_workspace_admin`. |
| `20260729025204_f1_3_onboarding_workspace_branding.sql` | Table `workspace_branding`, RPC `ensure_default_workspace()`. |
| `20260729031509_f1_3_security_hardening.sql` | Correction d'une politique Storage trop permissive (listage public du bucket `avatars`). |
| `20260729031642_f1_3_revoke_anon_execute.sql` | Révocation explicite de `EXECUTE` sur les fonctions `SECURITY DEFINER` pour le rôle `anon` (Supabase l'accorde par défaut, pas seulement via `PUBLIC`). |
| `20260729182343_f1_4_lot1_business_structure.sql` | Tables `accounts`, `campaigns`, `themes` + RLS + trigger `bump_revision()`. |
| `20260729182437_f1_4_lot2_content_production.sql` | Tables `topic_batches`, `topics`, `ideas`, `content_versions`, `workflow_stages`, `saved_views` + RLS. |
| `20260729182529_f1_4_lot3_publications.sql` | Table `publications` + RLS. |
| `20260729214139_f1_5_brands.sql` | Table `brands` + RLS (écriture réservée aux owners/admins, seule table à ce grain). |

## Audit de sécurité automatisé

À exécuter (lecture seule) après toute nouvelle migration :

```bash
npx supabase db advisors --linked --type security
```

État actuel (F1.9) : 5 alertes `WARN`, toutes revues et documentées comme non bloquantes — voir [checklist-deploiement.md](./checklist-deploiement.md).
