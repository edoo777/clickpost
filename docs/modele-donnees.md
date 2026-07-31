# Modèle de données

## Vue d'ensemble

15 tables dans le schéma `public`, RLS activée sans exception (vérifié F1.9).

### Données personnelles (strictement par utilisateur)

- **`profiles`** (1–1 avec `auth.users`) : identité, préférences. RLS : `id = auth.uid()` en lecture/écriture, aucune suppression possible.

### Workspace et appartenance

- **`workspaces`** : un workspace par défaut créé automatiquement à l'inscription (`ensure_default_workspace()`, idempotent). Lecture = membre, écriture (nom, etc.) = admin, création = le créateur lui-même.
- **`workspace_members`** : rôles `owner`/`admin`/`manager`/`creator`/`reviewer`/`client_approver`. Un utilisateur peut s'auto-insérer comme premier membre du workspace qu'il vient de créer (politique de bootstrap dédiée) ; toute autre écriture est réservée aux admins.
- **`workspace_branding`** : identité visuelle (couleurs, polices) par workspace. Lecture = membre, écriture = admin.

### Données de workspace (11 tables synchronisées, F1.4/F1.5)

Toutes partagent le même patron : `id uuid` (généré côté client, jamais régénéré), `workspace_id`, `created_by`, `created_at`/`updated_at`, `deleted_at` (suppression logique uniquement), `revision integer` (incrémentée par le trigger `bump_revision()` à chaque `UPDATE`, base du contrôle de concurrence optimiste).

| Table | Entité locale | Écriture RLS |
|---|---|---|
| `accounts` | Comptes sociaux | Tout membre |
| `brands` | Marques | **Admin uniquement** (seule exception) |
| `campaigns` | Campagnes | Tout membre |
| `themes` | Thématiques | Tout membre |
| `topic_batches` | Blocs de sujets | Tout membre |
| `topics` | Sujets | Tout membre |
| `ideas` | Idées | Tout membre |
| `content_versions` | Versions de contenu (Atelier) | Tout membre |
| `workflow_stages` | Étapes de workflow | Tout membre |
| `saved_views` | Vues enregistrées | Tout membre |
| `publications` | Publications planifiées | Tout membre |

Lecture : tout membre actif du workspace, sur les 11 tables, sans exception.

## Relations principales

- `ideas.brand_id → brands.id` (obligatoire), `theme_id`/`batch_id`/`campaign_id`/`workflow_stage_id` (optionnels).
- `content_versions.idea_id → ideas.id` (obligatoire).
- `topics.batch_id → topic_batches.id` (obligatoire) ; `topic_batches.brand_id`/`theme_id` (obligatoires).
- `publications.account_id → accounts.id` (obligatoire) ; `campaign_id`/`theme_id`/`idea_id` (optionnels).
- Ces relations ne sont **pas** imposées par des contraintes `FOREIGN KEY` strictes en base (décision documentée en F1.4, pour ne pas casser les données existantes lors de l'introduction progressive du modèle de marques réel) — elles sont vérifiées côté application, notamment par l'assistant d'import F1.8 (graphe de dépendances, 3 lots ordonnés).

## Politiques RLS — principe

```sql
create or replace function is_workspace_member(ws_id uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = ws_id and user_id = auth.uid() and status = 'active'
  );
$$;
```

`is_workspace_admin(ws_id)` suit le même principe, restreint aux rôles `owner`/`admin`. Les deux fonctions ont leur `EXECUTE` explicitement révoqué pour `anon` (Supabase l'accorde par défaut à la création, pas seulement via `PUBLIC` — piège documenté et corrigé dès F1.3).

**Limite assumée** : la restriction fine par marque (`TeamMember.brands`, ex. un `reviewer` cantonné à certaines marques) n'est pas appliquée en RLS — le grain reste le workspace, le filtrage par marque reste géré côté application.

## Stockage (Supabase Storage)

Un bucket **`avatars`**, public, sans politique de lecture/listage (les objets publics sont servis par URL directe, une politique de listage n'aurait fait qu'exposer inutilement le contenu du bucket — supprimée en F1.3). Écriture (insert/update/delete) restreinte au propriétaire du fichier.
