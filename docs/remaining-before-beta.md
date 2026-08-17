# ClickPost — Ce qui reste avant la bêta (5 à 10 utilisateurs)

Liste stricte, mise à jour à la fin de la session autonome du 2026-08-17 (3e passage — configuration
Admin + audit de sécurité approfondi). Ne contient que ce qui reste réellement à faire — voir
`docs/beta-readiness-audit.md` pour le détail de ce qui est déjà prêt, et
`docs/autonomous-development-report.md` pour le détail complet de cette session.

Depuis la dernière version de ce document : `ANTHROPIC_MODEL` et `ADMIN_EMAILS` sont désormais
configurés (espace Admin et IA réellement testables) ; un bug de sécurité critique a été trouvé et
corrigé — le contournement de l'approbation qui permettait de publier réellement sur LinkedIn du
contenu jamais approuvé ; une fuite de données entre comptes sur navigateur partagé a été corrigée ;
plusieurs modules jamais audités (authentification, onboarding, tableau de bord, marques,
thématiques, boîte à idées, générateur, Assistant IA, Atelier, publications, calendrier) ont été
passés en revue en profondeur.

## Configuration manuelle requise (aucune ne peut être faite par l'agent)

1. **Déploiement Vercel réel** — jamais effectué, variables d'environnement de production à
   configurer (voir `docs/deployment-checklist.md`).
2. **`YOUTUBE_API_KEY`, `GAMMA_API_KEY`, `CRON_SECRET`** — absents de `.env.local`, non requis pour
   tester le cœur de l'application (Tendances/Rapports/Cron LinkedIn restent fonctionnels sans eux,
   avec des états honnêtes « non configuré », déjà vérifié en conditions réelles cette session).

## Tests navigateur humains obligatoires avant d'inviter des testeurs

1. Parcours complet d'un nouvel utilisateur : inscription → confirmation e-mail → connexion →
   onboarding → création de marque → génération de sujets → Atelier → publication LinkedIn.
2. **Workflow d'approbation LinkedIn de bout en bout** (nouveau, prioritaire) : créer une
   publication LinkedIn, vérifier qu'aucune action ne permet de la faire passer à « Programmée »
   avant qu'elle soit « Approuvée », approuver, programmer, vérifier que le planificateur (ou le
   bouton « Publier via LinkedIn ») fonctionne normalement pour un compte owner/admin — et qu'il est
   refusé pour un membre non owner/admin.
3. Rapports : générer, éditer, enregistrer, rouvrir, vérifier l'historique avec un vrai compte.
4. Espace Admin : se connecter avec `adminclickpost@gmail.com`, modifier un prompt (y compris le
   nouveau champ « prompt système »), vérifier l'effet sur une vraie génération IA ; modifier un
   texte produit et vérifier son affichage réel.
5. Landing page `/bienvenue` sur mobile, tablette, desktop.
6. Vérifier qu'un utilisateur non-admin ne peut pas accéder à `/admin` (doit être redirigé).
7. Première exécution réelle du Cron LinkedIn en production (jamais testée en conditions réelles).
8. **Déconnexion/reconnexion avec deux comptes différents sur le même navigateur** (nouveau) —
   vérifier qu'aucune donnée du premier compte n'apparaît jamais pour le second.

## Décisions produit encore ouvertes

- **Sélecteur d'identité fictif dans la barre latérale** (« Connecté en tant que ») — `team-store`
  propose de basculer entre des membres d'équipe fictifs (démonstration), déconnectés de l'identité
  réelle Supabase affichée dans la barre supérieure. Alimente aussi « Mes tâches » et la résolution
  de l'approbateur. Nécessite une vraie décision produit (lier à l'identité réelle, limiter à un
  seul utilisateur réel par workspace pour la bêta, ou clarifier visuellement que c'est un mode
  démonstration) avant toute correction — non modifié cette session, volontairement, pour ne pas
  prendre cette décision à votre place.
- **Autres réseaux sociaux** : les masquer/étiqueter « bientôt disponible » dans l'UI, ou limiter
  la bêta à LinkedIn uniquement (recommandé — c'est déjà le cas de fait, aucune UI ne prétend le
  contraire).
- **Invitation d'équipe simulée** : limiter la bêta à un seul utilisateur par workspace, ou
  clarifier dans l'UI que l'invitation n'envoie pas réellement d'e-mail. Lié au point ci-dessus.
- **Onglet « Banque d'idées »** : n'affiche aujourd'hui que des notes libres, pas les idées
  générées par le Générateur de sujets (qui restent réelles, juste retrouvables uniquement en
  rouvrant le lot de génération). Le message trompeur a été corrigé cette session ; reste à décider
  si une vraie liste d'idées doit réapparaître dans cet onglet.
- **Documents de schéma périmés** (`docs/modele-donnees.md`, `docs/migrations.md`) — à régénérer
  uniquement si un tiers doit s'appuyer dessus.

## Dette technique mineure, non bloquante

- `GammaExportPanel` ne restaure pas l'état « PDF déjà généré » lors de la réouverture d'un
  rapport qui en aurait un — actuellement invisible tant que Gamma n'est pas configuré/activé.
- Texte produit `coming_soon_other_networks` défini dans l'Admin mais pas encore affiché dans une
  page réelle.
- Une seule marche arrière pour les prompts/textes admin (pas d'historique complet).
- Tendances : quotas et cache de veille Web en mémoire de processus, non partagés entre plusieurs
  instances serveur — voir `docs/limites-connues.md`. Sans impact pour une bêta à faible trafic sur
  une seule instance.
- Approbation des publications : `canAct` (qui peut approuver) n'est vérifié que côté client — la
  RLS de `publications` autorise l'écriture à tout membre du workspace, pas seulement à
  l'approbateur désigné ou à un admin. Un membre malintentionné pourrait forcer le statut
  `approved` via un appel direct au client Supabase. Non corrigé cette session (nécessite une
  politique RLS ou une fonction dédiée référençant l'identité de l'approbateur — lié à la décision
  produit sur l'identité d'équipe ci-dessus). Le contournement le plus grave (publication réelle
  sans approbation) est lui bloqué en base de données, voir le rapport de session.
- Cast de type non vérifié sur les résultats de veille Web (`WebSearchTrigger.tsx`) — sévérité
  faible, aucun bug actuel démontré.
- Assertions non-null et `Map` non bornées dans les fournisseurs/quotas Tendances — sévérité
  faible, fuite lente sur un processus long-vivant uniquement.

## Hors périmètre volontaire (ne pas développer avant la bêta)

- Stripe / paiement.
- Instagram, Facebook, TikTok, YouTube.
- Intégration Gamma réelle (clé non configurée).
- Portail client agence complet (l'architecture le permet déjà, non construit).
