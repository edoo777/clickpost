# ClickPost — Ce qui reste avant la bêta (5 à 10 utilisateurs)

Liste stricte, mise à jour à la fin de la session autonome du 2026-08-17. Ne contient que ce qui
reste réellement à faire — voir `docs/beta-readiness-audit.md` pour le détail de ce qui est déjà
prêt.

## Configuration manuelle requise (aucune ne peut être faite par l'agent)

1. **`ANTHROPIC_MODEL`** — toujours absent de `.env.local` au moment de cette session (déjà
   signalé lors d'une session précédente). Sans cette variable, toutes les fonctions IA tombent en
   mode simulé étiqueté. **Bloquant pour tester réellement l'IA.**
2. **`ADMIN_EMAILS`** — à définir pour accéder à `/admin` (voir `docs/admin-guide.md`). Sans elle,
   l'espace Admin reste inaccessible à tout le monde, y compris vous.
3. **Déploiement Vercel réel** — jamais effectué, variables d'environnement de production à
   configurer (voir `docs/deployment-checklist.md`).

## Tests navigateur humains obligatoires avant d'inviter des testeurs

1. Parcours complet d'un nouvel utilisateur : inscription → confirmation e-mail → connexion →
   onboarding → création de marque → génération de sujets → Atelier → publication LinkedIn.
2. Rapports : générer, éditer, enregistrer, rouvrir, vérifier l'historique avec un vrai compte.
3. Espace Admin : se connecter avec un e-mail dans `ADMIN_EMAILS`, modifier un prompt, vérifier
   l'effet sur une vraie génération IA ; modifier un texte produit (titre d'onboarding) et vérifier
   son affichage réel.
4. Landing page `/bienvenue` sur mobile, tablette, desktop.
5. Vérifier qu'un utilisateur non-admin ne peut pas accéder à `/admin` (doit être redirigé).
6. Première exécution réelle du Cron LinkedIn en production (jamais testée en conditions réelles).

## Décisions produit encore ouvertes

- **Autres réseaux sociaux** : les masquer/étiqueter « bientôt disponible » dans l'UI, ou limiter
  la bêta à LinkedIn uniquement (recommandé — c'est déjà le cas de fait, aucune UI ne prétend le
  contraire).
- **Invitation d'équipe simulée** : limiter la bêta à un seul utilisateur par workspace, ou
  clarifier dans l'UI que l'invitation n'envoie pas réellement d'e-mail.
- **Documents de schéma périmés** (`docs/modele-donnees.md`, `docs/migrations.md`) — à régénérer
  uniquement si un tiers doit s'appuyer dessus.

## Dette technique mineure, non bloquante

- `GammaExportPanel` ne restaure pas l'état « PDF déjà généré » lors de la réouverture d'un
  rapport qui en aurait un — actuellement invisible tant que Gamma n'est pas configuré/activé.
- Texte produit `coming_soon_other_networks` défini dans l'Admin mais pas encore affiché dans une
  page réelle.
- Une seule marche arrière pour les prompts/textes admin (pas d'historique complet).

## Hors périmètre volontaire (ne pas développer avant la bêta)

- Stripe / paiement.
- Instagram, Facebook, TikTok, YouTube.
- Intégration Gamma réelle (clé non configurée).
- Portail client agence complet (l'architecture le permet déjà, non construit).
