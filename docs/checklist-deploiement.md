# Checklist de déploiement

## Avant chaque déploiement

- [ ] `npm run lint`, `npx tsc --noEmit`, `npm run build` passent sans erreur.
- [ ] `git diff --check` propre (pas d'erreurs d'espaces blancs).
- [ ] `npx supabase migration list` confirme local = distant, aucune migration en attente non revue.
- [ ] `npx supabase db advisors --linked --type security` relancé — comparer aux alertes déjà connues (voir ci-dessous), signaler toute **nouvelle** alerte avant de déployer.
- [ ] Variables d'environnement de production configurées sur la plateforme d'hébergement : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — jamais `service_role`.
- [ ] Supabase Authentication → URL Configuration : **Site URL** et **Redirect URLs** pointent vers le domaine de production (pas `localhost`).
- [ ] Aucun secret dans le dépôt (`.env*` gitignoré — vérifié F1.9, aucun fichier suivi).

## État des alertes de sécurité connues (relevé F1.9)

| Alerte | Fonction/réglage | Statut |
|---|---|---|
| `authenticated_security_definer_function_executable` | `is_workspace_member`, `is_workspace_admin`, `ensure_default_workspace`, `get_active_prompt_override` | **Intentionnel** — appelées via RPC par l'application en tant qu'utilisateur authentifié ; `EXECUTE` déjà révoqué pour `anon`. `get_active_prompt_override` (ajoutée 2026-08-17) restreint volontairement la portée : ne renvoie que 2 champs pour une clé active, remplace une politique RLS de lecture trop permissive sur `prompt_overrides`. Ne pas « corriger ». |
| `anon_security_definer_function_executable` / `authenticated_security_definer_function_executable` | `rls_auto_enable()` | Event trigger fourni par l'échafaudage Supabase (active RLS automatiquement sur toute nouvelle table `public`), pas une fonction métier. Non introduite par une migration F1. Recommandation Supabase standard, impact pratique limité (non invocable comme un RPC normal). **Aucune action sans revue dédiée.** |
| `auth_leaked_password_protection` | Réglage Auth (tableau de bord, pas du code) | Désactivée par défaut. **Recommandé de l'activer avant la mise en production** (Authentication → Policies → Password Protection) — action manuelle dans le tableau de bord, hors du périmètre du dépôt. |

## Recommandé avant la mise en production réelle (hors périmètre F1)

- Décider d'un fournisseur d'IA réel si la génération de contenu doit devenir opérationnelle (voir [limites-connues.md](./limites-connues.md)).
- Décider d'une stratégie de test automatisé si l'équipe grandit.
- Revoir la restriction fine par marque si des rôles `reviewer`/`client_approver` cantonnés à certaines marques doivent être réellement appliqués (actuellement filtré côté application, pas en RLS).
