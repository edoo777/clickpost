# ClickPost — Ce qui reste avant la bêta (5 à 10 utilisateurs)

Liste stricte, mise à jour à la fin de la session autonome du 2026-08-18 (6e passage —
internationalisation FR/EN complète du produit, retrait du sélecteur d'identité fictif en
production, audit complet du parcours utilisateur, correction de la langue des générations IA,
renforcement des tests automatisés). Ne contient que ce qui reste réellement à faire — voir
`docs/clickpost-product-status.md` pour l'état détaillé fonctionnalité par fonctionnalité.

Depuis la dernière version de ce document :
- Le sélecteur « Connecté en tant que » n'est plus visible en production — l'identité réelle de
  l'utilisateur (via son e-mail Supabase) est désormais mise en correspondance automatique avec
  l'annuaire d'équipe local ; le sélecteur manuel ne reste disponible qu'en développement.
- L'i18n couvre désormais entièrement l'authentification, l'onboarding, le tableau de bord, et les
  en-têtes de toutes les autres pages de l'application (voir décision ouverte ci-dessous pour ce
  qui reste en français à l'intérieur de chaque page).
- 5 routes IA connectées à Claude ignoraient la langue de l'interface et généraient toujours en
  français : génération complète de l'Atelier, réécriture de sélection, les 3 catalogues d'actions
  rapides de la Banque, la suggestion de thématiques de marque, et l'analyse de tendance —
  toutes corrigées.
- 4 bugs réels trouvés par un audit du parcours complet (inscription → ... → nouvelle
  planification) ont été corrigés : le réglage « comportement après approbation » n'avait aucun
  effet réel ; une publication dans la colonne « Prêt à programmer » ne pouvait jamais être
  programmée (bloqué à trois endroits, dont le verrou en base) ; les actions d'optimisation
  créaient toujours une idée sur la première marque du workspace plutôt que la marque filtrée ;
  `/admin/utilisateurs` masquait silencieusement les erreurs Supabase.
- 12 nouveaux tests automatisés (approbation, langue des prompts IA, interpolation i18n).

## Configuration manuelle requise (aucune ne peut être faite par l'agent)

1. **Déploiement Vercel réel** — jamais effectué, explicitement mis en pause par l'utilisateur
   cette session (« ne déploie pas encore, nous le ferons après validation fonctionnelle »).
2. **`YOUTUBE_API_KEY`, `GAMMA_API_KEY`, `CRON_SECRET`** — absents de `.env.local`, non requis pour
   tester le cœur de l'application.
3. **Identifiants développeur des autres réseaux sociaux** (Instagram/Facebook, TikTok, X,
   YouTube) — aucun compte développeur n'existe pour ces plateformes ; l'architecture
   (`PublishProvider`, voir `docs/social-platform-setup.md`) est prête à les recevoir, mais aucune
   intégration réelle ne peut être testée sans ces identifiants.

## Tests navigateur humains obligatoires avant d'inviter des testeurs

1. Parcours complet d'un nouvel utilisateur : inscription → confirmation e-mail → connexion →
   onboarding → création de marque → génération de sujets → Atelier → publication LinkedIn.
2. Workflow d'approbation LinkedIn de bout en bout, y compris le nouveau comportement
   « Programmé automatiquement » (réglage Paramètres → Processus de travail) et le déplacement
   d'une publication « Prêt à programmer » vers « Programmé » (glisser-déposer ET menu déroulant).
3. Sélecteur de langue FR/EN depuis la barre latérale et la barre supérieure ; vérifier la
   persistance après rechargement et après déconnexion/reconnexion (`profiles.ui_locale`).
   Générer un contenu IA (Atelier, actions rapides de la Banque, suggestion de thématiques,
   analyse de tendance) en anglais et vérifier que la réponse est bien en anglais dans les 5
   routes corrigées cette session.
4. Vérifier qu'aucun utilisateur normal ne voit plus jamais le sélecteur « Connecté en tant que »
   (dev uniquement désormais) et que son propre nom/rôle s'affiche correctement dans « Mes
   tâches », les commentaires, et les approbations, dérivé automatiquement de son e-mail réel.
5. Sur `/performances`, filtrer sur une marque autre que la première du workspace puis cliquer une
   action d'optimisation (« Ajouter au calendrier », etc.) — vérifier que l'idée créée appartient
   bien à la marque filtrée.
6. `/admin/utilisateurs` : vérifier l'affichage normal (pas de bannière d'erreur) avec des
   identifiants Supabase valides.
7. Responsive : mobile, tablette, desktop, dans les deux langues — non vérifiable par l'agent
   (aucun accès navigateur réel).
8. États de chargement / erreur / vide sur les principaux écrans (dashboard, calendrier,
   publications, boîte à idées, tendances, rapports) — relus dans le code cette session, jamais
   testés en conditions réelles de réseau lent ou d'erreur serveur.

## Décisions produit encore ouvertes

- **Couverture i18n à l'intérieur de chaque page** (mise à jour, périmètre réduit mais toujours
  ouvert) : l'authentification, l'onboarding, le tableau de bord et les en-têtes de toutes les
  pages sont désormais traduits. Le contenu détaillé de chaque page (formulaires, filtres, listes,
  libellés de statut/plateforme/format comme `STATUS_LABEL`/`PLATFORM_LABEL`/`FORMAT_LABEL`,
  partagés par le calendrier, les publications et la boîte à idées) reste en français uniquement —
  un utilisateur en anglais verra un mélange FR/EN au-delà du tableau de bord. La prochaine étape à
  plus fort effet de levier serait de convertir ces trois tables de libellés partagées en clés de
  traduction (un seul point de changement, propagé automatiquement partout où elles sont
  utilisées) plutôt que de traduire page par page.
- **Sélecteur d'identité — décision appliquée, à valider en usage réel** : l'auto-association par
  e-mail suppose qu'un utilisateur réel a une entrée dans l'annuaire d'équipe local (toujours un
  jeu de données fictif, voir ci-dessous) avec la même adresse. Si aucune correspondance n'existe,
  l'utilisateur reste associé au membre par défaut (`tm-3`) — comportement à valider avec de vrais
  comptes bêta ayant des adresses différentes de l'annuaire fictif.
- **Annuaire d'équipe entièrement fictif** (déjà connu, confirmé cette session) : `team-data.ts`
  contient 9 membres fabriqués (noms, e-mails, rôles), non reliés à `workspace_members` réel. C'est
  ce jeu de données qui alimente les commentaires, l'attribution de tâches, les approbateurs par
  défaut — fonctionnel pour la démo, mais une vraie bêta à plusieurs comptes réels nécessitera de
  relier cet annuaire à `workspace_members`/Supabase Auth (chantier plus large, hors du périmètre
  d'une simple correction cette session).
- **Autres réseaux sociaux** : l'architecture (`PublishProvider`) les supporte structurellement
  (capacités déclarées pour chacun, jamais de configuration simulée), mais aucune intégration
  réelle n'existe — décision à prendre : les masquer/étiqueter « bientôt disponible » dans l'UI, ou
  limiter la bêta à LinkedIn uniquement (recommandé).
- **Invitation d'équipe simulée** : toujours ouvert (voir annuaire fictif ci-dessus, même cause
  racine).
- **Rendu dynamique forcé sur toutes les routes** : compromis assumé depuis la session
  précédente (i18n SSR via `cookies()`), impact négligeable pour une bêta à faible trafic.

## Dette technique mineure, non bloquante

- `GammaExportPanel` ne restaure pas l'état « PDF déjà généré ».
- Une seule marche arrière pour les prompts/textes admin (le champ `version` compte les
  enregistrements mais ne permet pas de consulter les versions intermédiaires).
- Tendances : quotas/cache en mémoire de processus, non partagés entre instances.
- Approbation des publications : `canAct` vérifié côté client uniquement (RLS = appartenance au
  workspace, pas identité de l'approbateur) ; le contournement le plus grave reste bloqué par le
  trigger de transition de statut en base de données.
- 2 alertes `npm audit` restantes (postcss, sharp), décision volontairement non prise.
- `publications/generate` et `tendances/web-search` acceptent un champ `language` distinct de la
  langue de l'interface (langue du contenu généré / région des tendances recherchées) — un choix
  de conception délibéré, pas un oubli, mais à documenter clairement dans l'UI si ce n'est pas déjà
  le cas, pour éviter la confusion avec le sélecteur de langue de l'interface.

## Hors périmètre volontaire (ne pas développer avant la bêta)

- Paiement (Stripe).
- Intégrations API réelles pour Instagram, Facebook, TikTok, YouTube, X (architecture prête,
  identifiants développeur manquants — voir `docs/social-platform-setup.md`).
- Intégration Gamma réelle (clé non configurée).
- Portail client agence complet (l'architecture le permet déjà, non construit).
- Refonte de l'annuaire d'équipe pour le relier à Supabase Auth/`workspace_members` (chantier
  distinct, plus large qu'une correction ponctuelle).
- Déploiement de production (explicitement mis en pause par l'utilisateur cette session).
