# ClickPost — Ce qui reste avant la bêta (5 à 10 utilisateurs)

Liste stricte, mise à jour à la fin de la session autonome du 2026-08-18 (5e passage — parcours
professionnel complet : validation/révision, architecture multi-plateformes, internationalisation
FR/EN, réutilisation de contenu, boucle d'optimisation IA, Admin). Ne contient que ce qui reste
réellement à faire — voir `docs/clickpost-product-status.md` pour l'état détaillé fonctionnalité
par fonctionnalité, `docs/beta-readiness-audit.md` pour l'historique, et
`docs/autonomous-development-report.md` pour le détail complet de cette session.

Depuis la dernière version de ce document : le registre de fournisseurs de publication route
désormais réellement LinkedIn (bug d'incohérence corrigé) ; une architecture i18n centralisée
FR/EN a été mise en place (navigation, éléments communs, landing page, langue des générations IA) ;
une vraie fonctionnalité de réutilisation de contenu a été ajoutée (« Réutiliser ce contenu », avec
traçabilité) ; une fuite RLS a été corrigée sur `prompt_overrides` ; le versionnage des prompts
admin a été ajouté ; 5 bugs LinkedIn supplémentaires corrigés (jetons, programmation dans le passé).

## Configuration manuelle requise (aucune ne peut être faite par l'agent)

1. **Déploiement Vercel réel** — jamais effectué, variables d'environnement de production à
   configurer (voir `docs/deployment-checklist.md`).
2. **`YOUTUBE_API_KEY`, `GAMMA_API_KEY`, `CRON_SECRET`** — absents de `.env.local`, non requis pour
   tester le cœur de l'application.
3. **Identifiants développeur des autres réseaux sociaux** (Instagram/Facebook, TikTok, X,
   YouTube) — aucun compte développeur n'existe pour ces plateformes ; l'architecture
   (`PublishProvider`, voir `docs/social-platform-setup.md`) est prête à les recevoir, mais aucune
   intégration réelle ne peut être testée sans ces identifiants.

## Tests navigateur humains obligatoires avant d'inviter des testeurs

1. Parcours complet d'un nouvel utilisateur : inscription → confirmation e-mail → connexion →
   onboarding → création de marque → génération de sujets → Atelier → publication LinkedIn.
2. Workflow d'approbation LinkedIn de bout en bout (voir session précédente).
3. **Sélecteur de langue FR/EN** (nouveau) : basculer la langue depuis la barre latérale, la
   barre supérieure et la landing page ; vérifier la persistance après rechargement et après
   déconnexion/reconnexion (`profiles.ui_locale`) ; générer un contenu IA en anglais et vérifier
   que la réponse est bien en anglais.
4. **« Réutiliser ce contenu »** (nouveau) : depuis une publication approuvée/programmée/publiée,
   ouvrir la modale, changer de plateforme/format, confirmer, vérifier que l'Atelier s'ouvre avec
   le lien « Contenu réutilisé — voir la publication d'origine » visible.
5. **Boucle d'optimisation** (nouveau) : sur `/performances` avec des données réelles ou
   importées, vérifier que les recommandations (dont la nouvelle carte « meilleur contenu »)
   affichent des actions qui créent réellement une idée/ouvrent l'Atelier/le calendrier.
6. Rapports : générer, éditer, enregistrer, rouvrir, vérifier l'historique avec un vrai compte.
7. Espace Admin : se connecter avec `adminclickpost@gmail.com`, modifier un prompt (vérifier que
   le numéro de version s'incrémente après rechargement), vérifier l'effet sur une vraie
   génération IA.
8. Landing page `/bienvenue` sur mobile, tablette, desktop — dans les deux langues.
9. Vérifier qu'un utilisateur non-admin ne peut pas accéder à `/admin` (doit être redirigé).
10. Déconnexion/reconnexion avec deux comptes différents sur le même navigateur — vérifier
    qu'aucune donnée du premier compte n'apparaît jamais pour le second.

## Décisions produit encore ouvertes

- **Sélecteur d'identité fictif dans la barre latérale** (« Connecté en tant que ») — toujours non
  résolu, voir sessions précédentes. Alimente aussi la personne à qui un contenu réutilisé/une
  recommandation d'optimisation attribue la nouvelle idée créée.
- **Autres réseaux sociaux** : l'architecture (`PublishProvider`) les supporte désormais
  structurellement (capacités déclarées pour chacun), mais aucune intégration réelle n'existe —
  décision à prendre : les masquer/étiqueter « bientôt disponible » dans l'UI, ou limiter la bêta
  à LinkedIn uniquement (recommandé).
- **Invitation d'équipe simulée** : toujours ouvert.
- **Onglet « Banque d'idées »** : toujours ouvert.
- **Désynchronisation Idée ↔ Publication après transformation** : toujours ouvert. Note : le
  nouveau lien de traçabilité « Réutiliser ce contenu » (`derivedFromId`) est un lien différent
  (relie un contenu dérivé à son origine), pas une résolution de ce problème existant.
- **Couverture i18n incomplète** (nouveau, volontaire) : l'architecture FR/EN est posée et
  fonctionnelle de bout en bout, mais seules la navigation, les éléments d'interface communs et la
  landing page sont traduits. Le contenu détaillé de chaque module (tableau de bord, calendrier,
  formulaires de publication, boîte à idées, Assistant IA, Tendances, Rapports, Admin) reste en
  français uniquement — un utilisateur qui bascule en anglais verra un mélange FR/EN dans ces
  pages. Extension incrémentale possible via le même mécanisme (`t()`/dictionnaires), sans
  nouvelle architecture. Décision à prendre : prioriser quelles pages traduire en premier pour la
  bêta, ou limiter la bêta au français avec le sélecteur visible mais annoncé "en cours".
- **Rendu dynamique forcé sur toutes les routes** (nouveau, compromis technique) : la mise en
  place du rendu SSR correct de la langue (`cookies()` dans le layout racine) a fait perdre la
  génération statique de certaines pages publiques (`/bienvenue` notamment, auparavant statique).
  Impact réel négligeable pour une bêta à faible trafic ; Next.js Partial Prerendering
  supprimerait ce compromis plus tard sans changer l'architecture i18n.
- **Documents de schéma périmés** (`docs/modele-donnees.md`, `docs/migrations.md`) — à régénérer
  uniquement si un tiers doit s'appuyer dessus.

## Dette technique mineure, non bloquante

- `GammaExportPanel` ne restaure pas l'état « PDF déjà généré ».
- Texte produit `coming_soon_other_networks` défini dans l'Admin mais pas encore affiché.
- Une seule marche arrière pour les prompts/textes admin (pas d'historique complet au-delà de la
  dernière valeur — le nouveau champ `version` compte les enregistrements mais ne permet pas de
  consulter les versions intermédiaires).
- Tendances : quotas/cache en mémoire de processus, non partagés entre instances.
- Approbation des publications : `canAct` vérifié côté client uniquement (RLS = appartenance au
  workspace, pas identité de l'approbateur). Le contournement le plus grave (publication réelle
  sans approbation) reste bloqué en base de données (trigger `publications_check_status_transition`).
- Cast de type non vérifié dans `WebSearchTrigger.tsx` — sévérité faible.
- `workflow_stages` : contrainte RLS inerte (table non utilisée par aucune route réelle).
- 2 alertes `npm audit` restantes (postcss, sharp) — nécessitent une mise à jour de Next.js hors
  de la plage actuellement fixée, décision volontairement non prise.
- Repurposing (`derivedFromId`) ne relie qu'une Idée à la Publication dont elle est issue — pas de
  vue inverse listant tous les contenus dérivés d'une publication donnée (faisable plus tard sans
  changement de schéma, simple requête filtrée).

## Hors périmètre volontaire (ne pas développer avant la bêta)

- Stripe / paiement.
- Intégrations API réelles pour Instagram, Facebook, TikTok, YouTube, X (architecture prête,
  identifiants développeur manquants — voir `docs/social-platform-setup.md`).
- Intégration Gamma réelle (clé non configurée).
- Portail client agence complet (l'architecture le permet déjà, non construit).
- Traduction FR/EN complète de chaque module (voir décision ouverte ci-dessus).
