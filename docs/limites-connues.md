# Limites connues et fonctionnalités simulées

Document tenu à jour à la clôture de F1.9 — à réviser si l'une de ces limites est levée par une phase ultérieure.

## Fonctionnalités encore simulées (pas d'intégration réelle)

- **Génération de contenu par IA** : deux actions sont réellement branchées à Claude (Anthropic), chacune via sa propre route serveur Next.js, jamais depuis le navigateur — « Génération complète » dans l'Atelier (`src/app/api/ia/atelier/generation-complete`, F2.1) et « Générer les idées » dans le Générateur d'idées (`src/app/api/ia/generateur/topics`, une génération multi-thématiques = un seul appel Claude). Sans `ANTHROPIC_API_KEY`/`ANTHROPIC_MODEL` configurés côté serveur, ou en cas d'erreur/indisponibilité/réponse invalide, ces actions retombent automatiquement sur leur générateur simulé respectif, sans interruption. Toutes les autres actions (Assistant IA, réécriture de sélection, autres presets de l'Atelier, régénération de sujets non verrouillés hors thématique) restent entièrement simulées côté client — aucun appel réseau.
- **Thématique vs type de contenu** : la bibliothèque de thématiques de démonstration (`src/lib/themes-data.ts`) contient des libellés qui sont en réalité des types de contenu (ex. « Conseils pratiques », « Témoignage client », « Opinion ou expertise ») — hérités d'avant l'introduction du champ `contentType`. Non corrigés automatiquement (aucune reclassification silencieuse) ; à réviser manuellement si cette confusion gêne l'usage. Le Générateur d'idées empêche désormais Claude d'enregistrer un type de contenu dans le champ thématique pour toute nouvelle génération.
- **Connexion aux comptes sociaux** : « Ajouter un compte » simule une connexion — aucune authentification OAuth réelle, aucun appel aux API Instagram/Facebook/LinkedIn/TikTok/X/YouTube. Le statut « connecté » est un champ local.
- **Publication réelle sur les réseaux sociaux** : la planification existe (statuts, dates, files), mais aucune publication n'est réellement envoyée à un réseau social — pas d'intégration API sortante.
- **Paiement / abonnement** : la section « Abonnement » des paramètres est un affichage statique, aucun système de paiement n'est intégré.
- **Notifications** : aucun système de notification (e-mail, push) n'existe au-delà des préférences déclaratives dans les paramètres.

## Limites RLS assumées

- La restriction fine par marque (un `reviewer` cantonné à certaines marques via `TeamMember.brands`) n'est pas appliquée au niveau RLS — seul le grain workspace est vérifié en base ; le filtrage par marque reste géré côté application.

## Limites d'infrastructure

- Aucun test automatisé (unitaire/intégration/E2E) n'est configuré — la vérification repose sur `npm run lint`, `npx tsc --noEmit`, `npm run build`, et des parcours de test manuels documentés dans [tests-manuels.md](./tests-manuels.md).
- Aucun mécanisme de synchronisation temps réel (Supabase Realtime/WebSocket) — le pull cloud→local ne s'exécute qu'une fois par session (voir [offline-first.md](./offline-first.md)), pas en continu.
- La fusion de conflits reste au niveau de l'enregistrement entier (« dernier écrit gagne » ou choix explicite) — pas de fusion fine champ par champ automatique au-delà de ce que l'utilisateur sélectionne manuellement dans le Centre des conflits.
- **Tendances — quotas et cache de veille Web en mémoire de processus** (`src/lib/trends/web-search-quota.ts`, `rate-limit.ts`, `cache.ts`) : les compteurs (quota de recherche, limite de débit, cache des résultats) vivent dans de simples `Map` en mémoire, réinitialisées au redémarrage et non partagées entre plusieurs instances serveur. Sur un déploiement à plusieurs instances actives simultanément, le plafond affiché (« 1 recherche Web globale / 2h / workspace ») est donc appliqué par instance, pas platform-wide — un vrai contrôle de coût nécessiterait un compteur partagé (ligne Supabase, Redis...) au lieu de ces `Map`. Non bloquant pour une bêta à faible trafic sur une seule instance.

## Comptes et données de démonstration

Un jeu de données de démonstration (marques, comptes, publications, thématiques, campagnes) reste présent dans le code (`src/lib/*-data.ts`, `src/lib/brand-profiles.ts`) pour l'expérience hors-connexion/premier lancement — explicitement exclu de toute synchronisation vers Supabase par un registre centralisé (`src/lib/sync/seed-registry.ts`), vérifié à nouveau lors de F1.9 (aucune donnée de démonstration trouvée dans les 11 tables de workspace).
