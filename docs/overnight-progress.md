# Journal de progression — session autonome ClickPost

Mise à jour après chaque phase terminée. Ne remplace pas le rapport final
(`docs/overnight-final-report.md`, produit à la fin de la session).

## Phase A — Création assistée par Claude et médias des publications

**Statut : terminée** (déjà réalisée avant le début de la session autonome).

- **Commit** : `4252eb8` — « Nouvelle publication en espace de création hybride ».
- Couvre l'intégralité du périmètre demandé pour la Phase A : mode Manuel/Avec Claude, génération
  complète, aperçu avant insertion, application sélective, protection contre l'écrasement,
  annulation de la dernière insertion, actions IA rapides, upload réel (images/vidéos),
  glisser-déposer, aperçu, progression, remplacement, suppression, réorganisation, persistance,
  nettoyage à l'annulation, isolation par workspace (RLS), bucket privé `publication-media`, URLs
  signées, limites 10 Mo/image, 200 Mo/vidéo, 8 médias max.
- Migration `20260803024525_publication_media_storage.sql` appliquée et vérifiée (bucket + 4
  politiques RLS confirmées en lecture directe).
- Aucun commit dupliqué créé pour cette phase — l'historique Git existant n'est jamais réécrit.

## Phase B — Stratégie éditoriale complète des marques

**Statut : terminée.**

- **Commit** : voir `git log` (à la suite de cette entrée).
- **Fichiers modifiés** : `types/brand.ts` (7 nouveaux champs additifs : `valueProposition`,
  `audiencePainPoints`, `publishingFrequency`, `monthlyPublishingGoal`, `preferredContentTypes`,
  `preferredFormats`, `successMetrics` — sur `Brand` ET `BrandProfile`), `brands-store.tsx`
  (`BrandDraft` + `createBrand`), `brand-profiles.ts` (données de démonstration statiques mises à
  jour), `brand-completeness.ts` (indicateur de complétion étendu aux nouveaux champs, plus
  support des valeurs numériques), `components/brands/BrandProfileForm.tsx` (nouveaux champs dans
  les sections Positionnement/Audience/Rythme de publication/Contenu privilégié — **réutilise la
  page Marques existante, aucun second système créé**), `atelier-prompts.ts`,
  `generateur-prompt.ts` (+ route), `publication-generation-prompt.ts` (+ route) — le nouveau
  contexte stratégique (proposition de valeur, problèmes de l'audience) est désormais transmis à
  l'Atelier, au Générateur d'idées et à la génération de publications.
- **Correction incidente** : le champ `positioning` portait par erreur le libellé « Proposition de
  valeur » dans l'interface alors que ces deux concepts sont désormais distincts — corrigé.
- **Migration** : `20260803030827_brand_editorial_strategy.sql` — additive uniquement
  (`ADD COLUMN IF NOT EXISTS`, aucune colonne retirée, aucune donnée modifiée). Dry-run vérifié,
  puis appliquée réellement (critères d'autonomie respectés : additive, dry-run réussi, aucune
  suppression, aucune modification destructive). Confirmée à jour (`upToDate: true`).
- **Tests** : `npx tsc --noEmit` ✅, `npm run lint` ✅, `npm run build` ✅, `git diff --check` ✅.
- **Limite connue** : Tendances (`web-trend-search-prompt.ts`/`trend-analysis-prompt.ts`) ne lit
  pas encore `valueProposition`/`audiencePainPoints` — ces routes reçoivent le contexte marque
  directement du client (par conception, elles ne relisent pas Supabase) ; le fil conducteur
  niche/nom de marque existe déjà, l'enrichissement complet est reporté (non bloquant, amélioration
  future documentée ici plutôt qu'oubliée).
- **Prochaine étape** : Phase C — Workflow de révision et validation (beaucoup de fondations
  existent déjà : statuts, `ApprovalActions`, `CollaborationPanel`, `HistoryTimeline` — à enrichir,
  pas à reconstruire).

## Phase C — Workflow de révision et validation éditoriale

**Statut : terminée** (périmètre resserré sur les points à plus forte valeur — voir limites
ci-dessous).

- **Commit** : voir `git log` (à la suite de cette entrée).
- **Nouveau statut `needs_changes`** (« Modifications demandées ») ajouté à `PublicationStatus` —
  jusqu'ici `requestChanges()` réutilisait à tort `"in_production"`, rendant une demande de
  modification indiscernable d'un contenu simplement en cours de rédaction. Propagé dans toutes
  les listes de statuts existantes (`PublicationsFilters`, `PublicationsTable`, `PublicationsKanban`,
  `PublicationForm`, `CalendarWorkspace`, `DashboardFilters`, `MyTasksWidget`) et dans le mapping
  bidirectionnel `idea-publication-sync.ts` (une idée déjà dotée de ce statut y correspond
  maintenant exactement, au lieu d'un mapping approximatif vers `in_production`).
- **Une publication approuvée ne peut plus être modifiée silencieusement** (exigence explicite du
  cahier des charges) : `hasApprovedContentChanged()` (nouveau, `src/lib/approval.ts`) compare le
  contenu réellement significatif (texte, extrait, CTA, premier commentaire, hashtags, médias,
  date programmée, plateforme, format — jamais les métadonnées de suivi comme `internalNotes`) ;
  si une publication `approved` est enregistrée avec un de ces champs modifié, `PublicationView`
  la repasse automatiquement en `in_review` et ajoute une entrée d'historique distincte
  (« Repassée en révision (modifiée après approbation) ») plutôt que la simple entrée « Modifiée ».
- **`ApprovalActions` n'était protégé par aucun contrôle de rôle** — n'importe quel visiteur de la
  fiche publication pouvait approuver/refuser/demander des modifications. Ajout d'un prop `canAct`
  (vrai si administrateur/propriétaire du workspace via `useWorkspaceSession().isAdmin`, ou si
  l'utilisateur courant est nommément l'approbateur assigné) ; sans ce droit, un message explique
  qui peut agir au lieu d'afficher les boutons.
- **Contournement de l'approbation via les listes/tableaux corrigé** : le statut « Approuvé » était
  sélectionnable directement dans le menu déroulant brut de `PublicationForm`, `PublicationsTable`
  et `PublicationsKanban`, et atteignable par glisser-déposer dans le Kanban — permettant
  d'approuver une publication sans jamais passer par `ApprovalActions` (donc sans droit vérifié, ni
  historique d'approbation). L'option « Approuvé » est maintenant désactivée dans ces menus tant
  que ce n'est pas déjà le statut courant, et un dépôt Kanban vers la colonne « Approuvé » est
  ignoré silencieusement (la carte reste à sa place) — seule la fiche publication, via les actions
  d'approbation protégées, peut faire passer un contenu à ce statut.
- **Indicateur de commentaires** ajouté sur `PublicationCard.tsx` et `ApprovalQueueList.tsx`
  (badge « N commentaire(s) », visible uniquement si au moins un commentaire existe).
- **« Notifications internes simples »** : couvertes par l'existant renforcé plutôt qu'un nouveau
  système — `ApprovalQueueList` affiche déjà le « prochain intervenant » par publication
  (`getNextActor`, `src/lib/approval.ts`), maintenant complété par le badge de commentaires ; aucune
  table ni file de notifications séparée créée (`PublicationHistoryEntry`/`PublicationComment`
  existants suffisent comme source).
- **Filtre par statut** (`PublicationsFilters.tsx`) : déjà présent avant cette phase, aucune
  modification nécessaire au-delà de l'ajout du nouveau statut à la liste.
- **Migration** : aucune. Tous les changements sont au niveau TypeScript/React ; aucun champ de
  base de données n'était requis (les statuts sont un type TypeScript, pas une colonne contrainte
  côté SQL).
- **Tests** : `npx tsc --noEmit` ✅, `npm run lint` ✅, `npm run build` ✅ (40 routes générées avec
  succès), `git diff --check` ✅ (seuls des avertissements LF/CRLF inoffensifs).
- **Limites connues / périmètre non traité dans cette phase** (documentées plutôt que bâclées) :
  - Le rôle vérifié pour `canAct` provient de `workspace_members` (Supabase, réel), mais le champ
    `publication.approver` reste un nom saisi localement via `useTeamSession` (simulateur d'équipe
    non encore relié 1-1 à un compte Supabase réel) — la comparaison par nom fonctionne pour l'usage
    actuel mais resterait fragile en cas d'homonymie entre membres ; une vraie liaison
    `TeamMember` ↔ `auth.users` est un travail plus large, hors périmètre de cette phase.
  - Les actions groupées existantes de `PublicationsTable.tsx` (`bulkDuplicate`, `bulkArchive`) ne
    permettent pas d'approuver en masse — elles restent donc déjà sûres par construction (aucun
    contournement d'approbation possible par ce biais) ; aucun changement nécessaire.
  - Le statut « Refusé » (`rejected`) reste sélectionnable directement dans les menus déroulants
    bruts (seul « Approuvé » a été verrouillé) — un refus manuel direct est jugé moins risqué qu'une
    fausse approbation (il ne prétend pas qu'un contenu a été validé), mais reste un contournement
    mineur du flux de refus motivé ; amélioration future possible si jugée nécessaire.
- **Prochaine étape** : Phase H — Parcours utilisateur complet (priorité explicite de
  l'utilisateur, avant la Phase D).

## Phase D — Architecture de programmation et publication multiréseaux

**Statut : partielle, documentée** (voir « Réordonnancement » ci-dessous — décision autonome
documentée, pas une exécution silencieuse de l'ordre annoncé).

- **Réordonnancement** : l'ordre de priorité donné (section 12) place la Phase H (parcours
  utilisateur complet) avant la Phase D (programmation/publication). En auditant la Phase H, il
  est apparu que ses dernières étapes du parcours (Planifier → Publier → Promouvoir → Analyser →
  Optimiser) dépendent d'infrastructures qui n'existaient pas encore (Phases D/E/F/G) — un audit
  de « parcours complet » aurait donc été partiel par construction. Décision autonome documentée
  ici (réversible, pas de perte de travail) : construire d'abord les fondations de la Phase D, puis
  revenir compléter la Phase H une fois qu'il y a réellement quelque chose à relier bout en bout.
  Le travail déjà réalisé en Phase C (statuts, `ApprovalActions`, historique) reste la base des
  premières étapes du parcours (idée → note → publication → révision → approbation), déjà bien
  reliées (confirmé par lecture de `IdeaWorkshopView.tsx`, qui propose déjà un bouton de
  progression contextuel : Transformer en publication → Envoyer en révision → Approuver →
  Planifier).
- **Commit** : voir `git log` (à la suite de cette entrée).
- **Nouveaux fichiers** :
  - `src/types/publishing-provider.ts` — abstraction `PublishProvider` (un principe non
    négociable en commentaire : `publish()` ne doit jamais renvoyer `"success"` sans appel réseau
    réel réussi), `PublishAttempt`, `PublishReadiness` (huit états : Non connecté, Connexion
    requise, Action manuelle requise, Contraintes non respectées, Prêt, Publication en cours,
    Publié, Échec).
  - `src/lib/publishing/providers.ts` — registre d'un `PublishProvider` par plateforme
    (Instagram/Facebook/LinkedIn/TikTok/YouTube/X/Threads/Pinterest/Autre) ; **tous** renvoient
    aujourd'hui `isConfigured() === false` (aucun identifiant API social réel dans ce projet —
    confirmé par lecture de `.env.example`, qui ne contient que Supabase/Anthropic/YouTube data
    API en lecture seule) ; `computePublishReadiness()` et `PUBLISH_READINESS_LABEL` dérivent
    l'état affiché de faits vérifiables (statut du compte, contraintes, configuration), jamais
    optimistes par défaut.
  - `src/lib/publishing/platform-constraints.ts` — validation réelle et utile dès maintenant
    (longueur de texte, nombre de hashtags, nombre/type de médias) par plateforme, avec limites
    explicitement documentées comme indicatives (non garanties exactes, à revérifier auprès de
    chaque plateforme).
  - `src/components/publications/ManualPublishPanel.tsx` — remplace tout envoi automatique
    fictif : pour une publication au statut « Programmé » (ou « Échec »), propose de copier le
    texte, télécharger chaque média (URL signée régénérée à la demande), une checklist de
    confirmation, puis un bouton « Marquer comme publiée manuellement » (actif seulement une fois
    la checklist cochée) ou « Signaler un échec » (motif obligatoire). Chaque confirmation crée
    une entrée dans le nouveau champ `Publication.publishAttempts` et dans l'historique existant —
    jamais une écriture silencieuse.
  - `docs/social-platform-setup.md` — procédure complète, plateforme par plateforme (portail
    développeur, permissions à demander, étapes pour brancher un vrai `PublishProvider` plus
    tard) — préparation à la demande explicite de la section 11 du mandat.
- **Fichiers enrichis** :
  - `src/types/publication.ts` — `Publication.publishAttempts?: PublishAttempt[]` (additif,
    optionnel — aucune des nombreuses constructions existantes de `Publication` n'a dû être
    modifiée, lues avec `?? []`).
  - `src/components/publications/PublicationView.tsx` — `handleMarkPublished`/`handleMarkFailed`,
    rendu de `ManualPublishPanel` juste après `ApprovalActions`.
  - `src/components/publications/PublicationForm.tsx`, `PublicationsTable.tsx`,
    `PublicationsKanban.tsx` — l'option de statut « Publié » est désormais désactivée dans les
    menus déroulants bruts (comme « Approuvé » en Phase C) tant que ce n'est pas déjà le statut
    courant, et un dépôt Kanban direct vers la colonne « Publié » est ignoré silencieusement (la
    carte reste à sa place) — seul le panneau de publication manuelle, avec sa checklist, peut
    faire passer une publication à ce statut.
- **Migration** : aucune. Tous les changements sont au niveau TypeScript/React ; `publishAttempts`
  est un champ optionnel du type `Publication` existant (stocké aujourd'hui via le même mécanisme
  IndexedDB/sync que le reste de `Publication`, sans changement de schéma Postgres nécessaire —
  cette persistance reste locale/synchronisée comme le reste du magasin `posts`, aucune table
  Supabase dédiée n'était nécessaire pour cette étape).
- **Tests** : `npx tsc --noEmit` ✅, `npm run lint` ✅, `npm run build` ✅ (40 routes), `git diff
  --check` ✅ (avertissements LF/CRLF inoffensifs uniquement).
- **Limites connues / ce qui reste** (périmètre volontairement resserré, documenté plutôt que
  bâclé) :
  - **Aucune connexion OAuth réelle** à aucune plateforme — c'est un point bloqué par des
    identifiants externes (comptes développeur Meta/LinkedIn/TikTok/X/Pinterest, revues
    d'application, souvent payantes ou soumises à approbation manuelle du réseau) qu'il n'est ni
    possible ni souhaitable de contourner. Documenté en détail dans
    `docs/social-platform-setup.md`.
  - **Modèle de compte connecté enrichi non fait** : le cahier des charges demande d'ajouter à
    `SocialAccount` une date de dernière vérification de connexion et une expiration de
    permission distincte du statut. `lastSyncedAt` existe déjà et `AccountStatus` couvre déjà
    `expired`, ce qui satisfait l'essentiel ; un champ d'expiration distinct n'a pas été ajouté
    faute d'un flux OAuth réel qui le remplirait honnêtement (ajouter un champ qu'aucune vraie
    connexion ne peut jamais renseigner aurait été un ajout cosmétique, pas fonctionnel).
  - **File de publication automatique (job queue)** non implémentée — délibérément, car sans
    fournisseur réel configuré, une file de traitement n'aurait rien à traiter ; le mode manuel
    couvre le besoin réel actuel. À construire quand un premier `PublishProvider` réel existera.
  - Phase H (parcours utilisateur complet) reste à finaliser une fois cette Phase D (et
    idéalement E/F/G) en place, pour un audit de bout en bout réellement complet plutôt que
    partiel — voir « Réordonnancement » ci-dessus.
- **Prochaine étape** : compléter Phase H (vérification du parcours de bout en bout, boutons de
  progression manquants) maintenant que la publication (manuelle) existe réellement, puis Phases
  F/G/E dans l'ordre de priorité annoncé, puis Phase I (qualité) et documentation finale.

## Phase H — Parcours éditorial complet du créateur

**Statut : terminée pour les étapes ayant une destination réelle** (voir limites — Promouvoir
reste explicitement hors périmètre, faute de Phase E).

- **Commit** : voir `git log` (à la suite de cette entrée).
- **Constat principal de l'audit** : le parcours était déjà beaucoup plus connecté qu'estimé.
  Vérifié par lecture directe du code (pas seulement supposé) :
  - `src/lib/develop-idea.ts` — point d'entrée unique, déjà bien documenté, qui relie Sujet/Note →
    Idée → Atelier avec dé-duplication garantie (`ensureIdeaForTopic`/`ensureIdeaForNote`) : aucune
    idée en double possible même en cas de double clic.
  - `src/components/trends/TrendActionsMenu.tsx` — 9 actions réelles déjà câblées par tendance :
    Enregistrer/Masquer/Non pertinente/Signaler/Voir la source/Générer des idées/Créer une
    note/**Créer une publication**/Ajouter au calendrier — la tendance alimente déjà directement
    l'idéation, la Banque et le calendrier.
  - `src/components/idea-workshop/IdeaWorkshopView.tsx` — bouton de progression contextuel déjà
    présent (`primaryAction`) : Transformer en publication → Envoyer en révision → Approuver →
    Planifier, qui s'adapte automatiquement au statut de l'idée.
  - `src/components/brands/BrandProfileView.tsx` — un seul système de marque avec onglets
    Identité/Positionnement/Comptes affiliés/**Thématiques**/Préférences éditoriales : stratégie et
    thématiques déjà unifiées, jamais un second système.
  - `/banque-idees` et `/generateur-idees` redirigent proprement vers `/boite-idees` (point d'entrée
    unique) — anciens liens préservés, aucune route morte.
- **Gap réel trouvé et corrigé** : dans `NoteEditor.tsx`, une fois une note convertie en idée
  (`note.convertedIdeaId` défini), le bouton « Convertir en idée » affichait « Idée déjà créée »
  sans aucune action au clic — aucun moyen direct de retrouver cette idée depuis la note (il fallait
  deviner qu'il fallait cliquer sur « Développer dans la production » à la place, qui ouvre la même
  idée via la dé-duplication existante, mais ce n'était pas évident). Corrigé : le bouton devient
  « Ouvrir l'idée dans l'Atelier » et navigue directement vers `/atelier/{convertedIdeaId}`.
- **Honnêteté des données renforcée** : en auditant l'étape « Analyser » du parcours, il est apparu
  que `/performances` (page pré-existante, antérieure à cette session autonome) affiche des
  statistiques (impressions, portée, interactions…) entièrement synthétiques
  (`src/lib/analytics-data.ts` → `generateDailySeries`), et que seul le panneau de recommandations
  précisait « en mode démonstration » — les autres graphiques et le KPI ne portaient aucune mention.
  Un bandeau clair a été ajouté en haut de `PerformancesView.tsx` : « Données de démonstration…
  seul le nombre de publications marquées Publié provient de vos données réelles. » — corrige un
  risque réel de statistiques prises pour authentiques, conformément à l'exigence explicite du
  mandat (« n'invente jamais de statistiques… ne mélange jamais silencieusement réel/démo »).
- **Nouveaux boutons de progression** sur `PublicationView.tsx`, visibles uniquement pour une
  publication au statut « Publié » :
  - **Analyser** — lien direct vers `/performances` (désormais honnêtement étiqueté démo).
  - **Recycler en nouvelle idée** — crée une nouvelle `Idea` (titre, texte et plateforme repris de
    la publication publiée) et ouvre directement l'Atelier pour la retravailler dans un nouveau
    format — referme la boucle éditoriale (idée → … → publication → **recyclage** → nouvelle idée)
    sans copier-coller manuel.
- **Boutons déjà couverts par les phases précédentes**, non refaits ici : Développer (Atelier),
  Envoyer en révision (Atelier + menu de statut), Approuver/Demander des modifications/Refuser
  (`ApprovalActions`, Phase C), Planifier (menu de statut, transition non verrouillée), Publier
  (`ManualPublishPanel`, Phase D).
- **Tests** : `npx tsc --noEmit` ✅, `npm run lint` ✅, `npm run build` ✅ (40 routes), `git diff
  --check` ✅.
- **Limites connues / hors périmètre de cette phase** (documentées plutôt que simulées) :
  - **« Promouvoir » n'a délibérément aucun bouton** — la Phase E (checklist de promotion :
    republier en story, mentionner un partenaire, etc.) n'existe pas encore ; ajouter un bouton sans
    destination réelle aurait été une fausse fonctionnalité. À ajouter avec la Phase E.
  - **`src/components/ideas-bank/IdeasBankKanban.tsx` est du code mort** — plus importé nulle part
    depuis la simplification de la Banque d'idées en vue Notes (commit `e8a68a8`, antérieure à
    cette session). Non supprimé dans cette phase (hors périmètre — relevé pour la Phase I,
    Qualité, qui prévoit explicitement la détection de code inutilisé).
  - Le bouton « Recycler » n'apparaît que pour le statut « Publié » ; une extension au statut
    « Archivée » est possible mais non ajoutée faute de besoin confirmé.
## Phase F — Analyse des performances éditoriales

**Statut : terminée** (périmètre complet choisi par l'utilisateur après audit détaillé).

- **Commit** : `5936ee7` — « Analyse des performances éditoriales ».
- **Régression corrigée en cours de route** : `Publication.publishAttempts` (ajouté en Phase D)
  n'avait aucune colonne Postgres correspondante — `mapRecordToRow` (src/lib/sync/mappers.ts)
  convertit mécaniquement chaque champ d'un enregistrement en colonne du même nom ; toute
  synchronisation d'une publication marquée publiée/échouée manuellement aurait donc échoué avec
  une erreur "column does not exist". Migration
  `20260803144505_publications_attempts_content_type.sql` — additive (`ADD COLUMN IF NOT EXISTS`
  pour `publish_attempts jsonb` et `content_type text`), dry-run vérifié puis appliquée réellement
  (`upToDate: true` confirmé après coup). Lecon retenue et documentée dans
  `imported-metrics-store.tsx` : tout nouveau champ synchronisé doit avoir une colonne réelle.
- **Nouveaux fichiers** : `types/analytics.ts` (métriques étendues + `MetricsSource`
  "imported"/"demo" — jamais "real" tant qu'aucun fournisseur n'existe), `types/stats-provider.ts`
  + `lib/analytics/stats-providers.ts` (abstraction `StatsProvider` par plateforme, même patron que
  `PublishProvider` de la Phase D, toutes non configurées), `lib/demo-data-preference.ts`
  (préférence d'appareil, jamais activée par défaut — ferme la collision de nom de marque
  identifiée à l'audit), `lib/analytics-csv.ts` (modèle CSV pré-rempli par identifiant réel de
  publication, analyse stricte — toute ligne sans identifiant connu est rejetée avec message
  explicite, jamais de correspondance approximative par titre), `lib/imported-metrics-store.tsx`
  (nouveau magasin, persistance IndexedDB locale uniquement — décision de périmètre documentée :
  la synchronisation Supabase multi-appareils de ces données est un travail distinct, non inclus),
  `components/performances/{CsvImportPanel,DemoDataToggle,MetricsSourceBadge}.tsx`.
- **Fichiers réécrits/enrichis** : `lib/analytics-data.ts` (génère désormais aussi
  vues/réactions/commentaires/partages/sauvegardes/conversions, toujours `source: "demo"`),
  `lib/analytics-report.ts` (réécriture substantielle : fusion importé/démo avec traçabilité de
  source jamais silencieuse — `DataSourceSummary`/`MetricsSourceBadge` ; `getPublishedCount`
  corrigé pour compter les publications réellement "Publié" indépendamment de toute donnée de
  performance, alors qu'il dépendait à tort de `getMatchingPerformedPublications` ; nouvelles
  répartitions par type de contenu/objectif/responsable/appel à l'action ; `getWorstPublications`
  ajouté), `types/publication.ts` (`contentType?`), `KpiGrid.tsx` (11 indicateurs au lieu de 7,
  badge de source), `TopPublicationsList.tsx`/`ThemePerformanceChart.tsx` (prop `title`
  personnalisable, réutilisés pour les nouvelles répartitions plutôt que dupliqués),
  `EvolutionChart.tsx` (11 métriques sélectionnables), `ReportPreview.tsx` (export CSV réel,
  export PDF resté désactivé "bientôt disponible"), `PerformancesView.tsx` (bandeau d'honnêteté
  dynamique, import CSV, bascule démonstration).
- **Répercussions sur le tableau de bord principal** : `dashboard-performance.ts` et les widgets
  `PerformanceOverview.tsx`/`TopPublicationsWidget.tsx`/`PerformanceChartCard.tsx`
  consommaient déjà ces fonctions avec l'ancienne signature — mis à jour pour passer
  `posts`/`importedMetrics`/la préférence de démonstration, sans changement de comportement
  visible pour l'utilisateur au-delà du même bandeau d'honnêteté implicite.
- **Tests** : `npx tsc --noEmit` ✅, `npm run lint` ✅, `npm run build` ✅ (40 routes), `git diff
  --check` ✅.
- **Limites connues** : import CSV non synchronisé entre appareils (voir ci-dessus) ; export PDF
  toujours non implémenté ; aucun fournisseur de statistiques réel (bloqué par l'absence
  d'identifiants API sociaux, comme documenté en Phase D).

## Phase G — Boucle d'optimisation éditoriale

**Statut : terminée.**

- **Commit** : voir `git log` (à la suite de cette entrée).
- **Nouveaux fichiers** : `lib/optimization-recommendations.ts` (génère des recommandations
  typées — `finding`/`recommendation`/`hypothesis`, jamais une seule catégorie indifférenciée —
  chacune porte un `dataBasis` explicite expliquant sur quoi elle s'appuie ; couvre format/
  thématique/plateforme/appel à l'action les plus performants, meilleur créneau, évolution du taux
  d'engagement, fréquence de publication réelle comparée à l'objectif mensuel de la marque —Phase
  B— quand défini, et une hypothèse de recyclage pour la publication la moins performante de la
  période), `components/performances/OptimizationPanel.tsx` (nouvel onglet « Optimisation » dans
  `/performances`, actions réelles par recommandation : Transformer en nouvelle idée / Recycler en
  autre format / Créer une variante / Ajouter au calendrier / Créer un test / Ignorer — chacune crée
  réellement une Idée via l'infrastructure existante (`useDevelopIdea`) et ouvre l'Atelier, sauf
  "Ignorer" qui ne fait disparaître la carte que localement).
- **Aucun appel Claude automatique** — toutes les recommandations sont calculées de façon
  déterministe à partir des données déjà affichées dans l'onglet Vue d'ensemble, jamais générées
  au chargement par un modèle.
- **Refactorisation opportuniste** : `lib/develop-idea.ts` gagne `buildIdeaFromSeed()`, une
  construction d'Idée générique déjà nécessaire à la fois pour "Recycler en nouvelle idée" (déjà
  ajouté en Phase H sur `PublicationView.tsx`) et pour les nouvelles actions d'optimisation —
  `PublicationView.handleRecycle` refactorisé pour la réutiliser plutôt que de dupliquer la
  construction.
- **Tests** : `npx tsc --noEmit` ✅, `npm run lint` ✅, `npm run build` ✅ (40 routes), `git diff
  --check` ✅.
- **Note de méthode** : Phases F et G ont été implémentées ensemble (choix explicite de
  l'utilisateur — périmètre "Complet") mais restent deux commits distincts comme prévu par le
  mandat, malgré le couplage des deux onglets dans un seul fichier `PerformancesView.tsx` :
  l'onglet Optimisation a été temporairement retiré, vérifié, commité pour F, puis restauré,
  revérifié et commité séparément pour G — même technique de reconstruction déjà utilisée plus tôt
  dans la session pour séparer des diffs entremêlés.
- **Limites connues** : pas d'analyse de "hooks" récurrents (le champ `hook` n'existe que sur
  `Idea`, pas sur `Publication` — ajouter ce champ et le faire remonter jusqu'à la publication est
  un travail distinct, non inclus) ; les tests éditoriaux créés via "Créer un test" sont de simples
  idées annotées, pas un système de suivi d'expérience A/B dédié (aurait dépassé le périmètre
  "boucle d'optimisation" demandé).
- **Prochaine étape** : Phase E (Promotion et diffusion), puis Phase I (Qualité, incluant la
  suppression du code mort `IdeasBankKanban.tsx` relevé en Phase H) et documentation finale.

## Phase E — Promotion et diffusion des contenus

**Statut : terminée.**

- **Commit** : voir `git log` (à la suite de cette entrée).
- **Aucun CRM séparé créé** — la checklist de promotion est un champ additif directement sur
  `Publication` (`promotionTasks?: PromotionTask[]`), au même titre que `media`/`comments`/
  `history`/`publishAttempts` déjà en jsonb sur la table `publications`. Migration
  `20260803154117_publications_promotion_tasks.sql` — additive uniquement, dry-run vérifié puis
  appliquée réellement (`upToDate: true` confirmé après coup).
- **Nouveaux fichiers** :
  - `types/promotion.ts` — `PromotionTask`/`PromotionTaskType` (huit actions fixes exactement
    celles du cahier des charges : repartager en story, diffuser dans une communauté, répondre aux
    premiers commentaires, mentionner/collaborer avec un partenaire, demander à l'équipe de
    partager, recycler dans un autre format, relancer à une date ultérieure, promotion payante
    explicitement marquée facultative) / `PromotionTaskStatus` (À faire/En cours/Terminée/Ignorée).
  - `lib/promotion.ts` — libellés, `buildDefaultPromotionTasks()` (génère les huit tâches une
    seule fois, jamais régénérées ni dupliquées), `getPromotionProgress()` (progression = tâches
    Terminées + Ignorées / total — une décision explicite de ne pas faire une action reste une
    décision prise), `isTaskOverdue()`/`isTaskDueToday()`, `getAllPromotionTasks()` (vue
    transversale filtrable, dérivée à la volée — jamais stockée séparément).
  - `components/publications/PromotionChecklist.tsx` — checklist par publication (responsable,
    échéance, statut, notes par tâche, barre de progression), rendue uniquement pour une
    publication déjà réellement publiée (juste après `ManualPublishPanel` sur la fiche
    publication).
  - `components/publications/PromotionTasksBoard.tsx` — **nouvel onglet « Promotion » du
    sélecteur de vues des publications déjà existant** (Tableau/Kanban/Calendrier/Cartes/Liste/
    **Promotion**) plutôt qu'une page ou un système séparé — vue transversale de toutes les tâches
    de promotion, filtrable par statut/action/responsable/marque, avec indicateurs « En retard »/
    « Aujourd'hui » (rappels internes simples, aucune infrastructure de notification nouvelle).
- **Fichiers enrichis** :
  - `types/publication.ts` (`promotionTasks?`), `lib/posts.ts` et `PublicationView.handleDuplicate`
    (une publication dupliquée ne doit hériter ni des tentatives de publication ni de la checklist
    de promotion de l'originale — corrigé dans les deux chemins de duplication existants),
    `PublicationView.tsx` (génère la checklist à la première publication manuelle réelle, jamais
    régénérée si déjà présente ; gestionnaire de mise à jour par tâche), `publications-view-storage.ts`
    / `PublicationsViewSwitcher.tsx` / `usePublicationsViewState.ts` (nouveau type de vue
    "promotion", mappage `SavedViewType` inoffensif puisque cette vue n'est pas une liste
    filtrable/triable — le bouton "Enregistrer comme vue" est masqué sur cet onglet).
  - `components/dashboard/MyTasksWidget.tsx` — étendu (pas un nouveau widget, pour ne pas
    surcharger un tableau de bord qui en compte déjà dix) pour inclure, dans la même liste « Mes
    tâches », les tâches de promotion en retard ou dues aujourd'hui assignées à l'utilisateur
    courant, aux côtés des publications qui attendent déjà une action de sa part.
- **Tests** : `npx tsc --noEmit` ✅, `npm run lint` ✅, `npm run build` ✅ (40 routes), `git diff
  --check` ✅.
- **Limites connues** : les huit tâches sont fixes (pas de tâche de promotion personnalisée
  ajoutable au-delà des huit prévues) — décision de périmètre alignée sur "ne construis pas un CRM
  complet" ; l'import CSV de métriques (Phase F) et cette checklist ne sont pas encore reliés (ex.
  suggérer automatiquement de cocher "Promotion payante" si un budget a réellement été dépensé) —
  amélioration future possible, non nécessaire au périmètre demandé.
- **Prochaine étape** : Phase I — Qualité globale (suppression du code mort confirmé, audit
  responsive/thèmes/permissions/RLS/synchronisation/erreurs, tests des parcours multi-workspace),
  puis documentation finale et `docs/overnight-final-report.md`.

## Phase I — Stabilisation du parcours éditorial ClickPost

**Statut : terminée** (audit ciblé et basé sur des preuves — analyse statique, requêtes en
lecture seule sur la base liée — plutôt qu'une revue manuelle exhaustive impossible sans
navigateur ; voir limites en fin de section).

- **Commit** : voir `git log` (à la suite de cette entrée).
- **Code mort supprimé** (vérifié fichier par fichier — recherché dans tout `src/`, jamais
  supprimé sur une simple intuition) :
  - `components/ideas-bank/{IdeasBankKanban,IdeasBankTable,IdeaBankCard,IdeasBankFilters,
    IdeaQuickEditPanel,BulkScheduleModal,BulkQuickActionModal,KanbanCard,KanbanColumnsManager,
    QuickActionsMenu}.tsx` — dix fichiers, restes de l'ancienne Banque d'idées (Cartes/Tableau/
    Kanban) retirée par le commit `e8a68a8` **avant** le début de la session autonome ; confirmé
    mort par recherche croisée (aucun import réel en dehors du cluster lui-même — `NoteEditor.tsx`
    utilise un fichier distinct, `notes/NoteQuickActionsMenu.tsx`, jamais celui supprimé).
  - `lib/workflow-stages.ts` — ses trois exports (`STAGE_COLOR_OPTIONS`, `buildDefaultWorkflowStages`,
    `nextWorkflowStageOrder`) n'étaient utilisés que par `IdeasBankKanban.tsx`, devenus
    entièrement morts une fois ce fichier supprimé.
  - `components/performances/RecommendationsPanel.tsx` — oubli de nettoyage de la Phase G,
    remplacé par `OptimizationPanel.tsx` mais jamais supprimé.
  - Détection par recherche scriptée (basename de chaque fichier de `src/components`/`src/lib`
    recherché dans tout `src`/`app`) plutôt qu'une simple lecture visuelle — a permis de retrouver
    `RecommendationsPanel.tsx` que la vérification manuelle avait manqué.
  - `npx tsc --noEmit` et `npm run build` (40 routes) confirmés propres après suppression —
    aucune référence résiduelle.
- **Synchronisation / RLS** : vérification systématique que chaque champ ajouté cette session à un
  type synchronisé (`Publication.publishAttempts`, `.contentType`, `.promotionTasks`) a bien une
  colonne Postgres réelle — confirmé par une requête en lecture seule sur la base liée
  (`information_schema.columns`). Les 4 politiques RLS de `publications`
  (`select/insert/update/delete_by_membership`) confirmées intactes par requête sur `pg_policy` —
  la RLS étant au niveau de la ligne (`workspace_id`), l'ajout de colonnes ne nécessite aucune
  politique supplémentaire ; l'isolation multi-workspace reste donc garantie pour les nouvelles
  données (tentatives de publication, checklist de promotion). `ImportedMetricRecord` confirmé
  volontairement absent de `SyncEntityType`/`SYNC_TABLE_BY_ENTITY` (persistance locale
  uniquement, décision déjà documentée en Phase F) — pas un oubli.
- **Absence de fausses statistiques ("[object Object]", objets rendus bruts)** : recherche ciblée
  des motifs à risque (`{error}`, `{xxxError}` sans `.message`) dans les composants — tous les
  états d'erreur trouvés sont typés `string | null` (confirmé pour `use-holidays.ts` et les
  variables `*Error` des formulaires), aucun risque identifié.
- **Réactif (mobile) et clair/sombre** : les composants ajoutés cette session (Promotion,
  Optimisation, import CSV, publication manuelle) vérifiés par recherche automatisée : aucune
  classe de couleur claire sans variante `dark:` correspondante, aucune largeur fixe en pixels
  sans repli responsive, usage cohérent de `flex-wrap`/`grid-cols-1 sm:...`.
- **Permissions** : le contrôle d'accès aux actions d'approbation (Phase C) et la génération de la
  checklist de promotion (Phase E, générée uniquement via le flux de publication manuelle déjà
  protégé) n'introduisent aucun nouveau chemin non protégé.
- **Limites de cet audit** (honnêtement documentées, pas de fausse déclaration d'exhaustivité) :
  - Aucun test dans un vrai navigateur n'a pu être exécuté (pas d'infrastructure Playwright/
    Vitest dans ce projet — décision déjà documentée plus tôt dans la session, reportée à une
    session future). L'audit responsive/clair-sombre/erreurs React repose donc sur une analyse
    statique du code (recherche de motifs, lecture ciblée), pas sur une vérification visuelle.
  - Le test explicite "Owner/Admin/Member/approbateur/non authentifié/deux workspaces distincts"
    demandé par le mandat n'a pas pu être exécuté en conditions réelles (nécessiterait plusieurs
    comptes Supabase réels et une session de test manuelle) — la logique de permission a été
    revérifiée par lecture de code (`useWorkspaceSession().isAdmin`, comparaison de nom
    d'approbateur) plutôt que testée en conditions réelles.
  - La recherche de code mort couvre `src/components` et `src/lib` (basename recherché dans tout
    le dépôt) mais pas une analyse d'accessibilité (aria/contraste) approfondie ni un audit de
    performance (taille de bundle, requêtes N+1) — hors périmètre du temps disponible.
- **Prochaine étape** : documentation finale (`docs/deployment-checklist.md`,
  `docs/content-creator-journey.md`, `docs/overnight-final-report.md`), commits séparés
  correspondants.
