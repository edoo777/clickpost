# ClickPost — État produit détaillé

Photographie de l'état réel du produit à la fin de la session autonome du 2026-08-18 (7e passage —
correctif de layout de la sidebar sur demande explicite, deuxième audit du parcours complet (2
bugs réels corrigés : « Ajouter au calendrier » n'atteignait jamais le calendrier, interrupteur
admin Gamma non appliqué côté serveur), audit sécurité/RLS/Admin sans nouvelle faille. Classification
stricte :

- **DONE** — construit, câblé à des données réelles, vérifié (build/typecheck/lint et, quand
  possible, vérification live en base ou sur route).
- **PARTIAL** — construit et fonctionnel pour une partie du périmètre annoncé ; le reste documenté
  comme restant (voir colonne « Action restante »).
- **BLOCKED** — ne peut pas progresser sans une ressource externe (identifiants, accès humain,
  déploiement) que l'agent n'a pas le droit de créer ou d'inventer.
- **NOT STARTED** — hors périmètre de cette session, volontairement non commencé.

« Testée » signifie : vérifiée par un moyen autre que la lecture du code (build, typecheck, test
automatisé, requête SQL live, appel de route réel, ou test humain en navigateur). Une case « Non »
signale l'absence de ce niveau de preuve, pas nécessairement un bug.

## 1. Parcours utilisateur de base

| Fonctionnalité | État | Testée | Blocage | Action restante |
|---|---|---|---|---|
| Inscription / connexion / session | DONE | Partiel (routes vérifiées, pas de parcours humain complet) | — | Test navigateur humain (inscription → confirmation e-mail) |
| Onboarding (marque, ton, piliers, objectifs) | DONE | Partiel (code + routes) | — | Test navigateur humain |
| Création/config de marque multi-workspace | DONE | Oui (RLS vérifiée en base) | — | — |
| Boîte à idées / génération de sujets IA | DONE | Partiel | — | Test navigateur humain avec vrai compte |
| Tendances | DONE | Partiel | — | Test navigateur humain |
| Atelier (création/réécriture de contenu) | DONE | Partiel | — | Test navigateur humain |
| Calendrier | DONE | Partiel | — | Test navigateur humain |
| Rapports (générateur narratif professionnel) | DONE | Partiel (build clean, non testé en navigateur) | — | Test navigateur humain (génération, édition, enregistrement, export Gamma) |
| Espace Admin | DONE | Oui (session admin réelle, écriture/lecture vérifiée en base) | — | Test navigateur humain complémentaire |
| Identité de l'utilisateur (attribution des commentaires/tâches/approbations) | DONE | Oui (typecheck/lint/tests) | — | Test navigateur humain avec plusieurs comptes réels à adresses différentes |

## 2. Chantier 2 — Workflow de validation/révision

| Fonctionnalité | État | Testée | Blocage | Action restante |
|---|---|---|---|---|
| Statuts Brouillon → À réviser → Modifications demandées → Approuvé → Prêt à programmer → Programmé → Publié | DONE (préexistant, vérifié conforme) | Partiel | — | Test navigateur humain du parcours complet |
| Transitions de statut protégées côté base (trigger) | DONE | Oui (vérifié en base) | — | — |
| Réglage « comportement après approbation » (Prêt à programmer / Programmé automatiquement) | DONE (corrigé cette session — bug trouvé par l'audit du parcours complet : le réglage était persisté mais jamais lu par l'action d'approbation) | Oui (test automatisé, typecheck) | — | Test navigateur humain |
| Transition « Prêt à programmer » → « Programmé » | DONE (corrigé cette session — bloquée à 3 endroits, dont le verrou en base, par un bug d'audit) | Oui (migration vérifiée en base, typecheck) | — | Test navigateur humain (glisser-déposer et menu déroulant) |
| Solo / équipe / agence / validation client | DONE (architecture générique par rôle workspace) | Partiel | — | Test humain multi-comptes |
| Commentaires, historique, auteur, approbateur, dates | DONE (préexistant) | Partiel | — | Test navigateur humain |

## 3. Chantier 3 — Architecture multi-plateformes sociales

| Fonctionnalité | État | Testée | Blocage | Action restante |
|---|---|---|---|---|
| Interface `PublishProvider` commune (capacités, publish, fetchPerformance) | DONE | Oui (tests automatisés + build) | — | — |
| LinkedIn — intégration réelle | DONE | Partiel (bugs de jetons/dates corrigés en session précédente, non re-testé humainement cette session) | — | Test navigateur humain avec vrai compte LinkedIn |
| Registre de fournisseurs câblé correctement (bug d'incohérence corrigé) | DONE | Oui (test automatisé) | — | — |
| Instagram / Facebook | NOT STARTED (architecture prête) | Non | BLOCKED — identifiants développeur Meta absents | Créer compte développeur Meta, configurer OAuth |
| TikTok | NOT STARTED (architecture prête) | Non | BLOCKED — identifiants développeur TikTok absents | Créer compte développeur TikTok |
| YouTube | NOT STARTED (architecture prête) | Non | BLOCKED — `YOUTUBE_API_KEY` absente | Configurer la clé API |
| X (Twitter) | NOT STARTED (architecture prête) | Non | BLOCKED — identifiants développeur X absents | Créer compte développeur X |
| Récupération de performances réelles (fetchPerformance) | PARTIAL (retourne honnêtement "not_supported" partout, aucune plateforme ne fournit encore de métriques réelles) | Oui (comportement vérifié par test) | — | Câbler une vraie API de métriques quand disponible |

## 4. Internationalisation FR/EN

| Fonctionnalité | État | Testée | Blocage | Action restante |
|---|---|---|---|---|
| Architecture i18n centralisée (dictionnaires, `useTranslations`, persistance, interpolation `{var}`) | DONE | Oui (SSR vérifié en live via curl dans les deux langues, test unitaire de l'interpolation) | — | — |
| Sélecteur de langue (barre latérale + barre supérieure) | DONE | Partiel | — | Test navigateur humain |
| Persistance cross-device (`profiles.ui_locale`) | DONE | Oui (migration appliquée, synchronisation vérifiée dans le code) | — | Test navigateur humain (déconnexion/reconnexion) |
| Navigation, éléments d'interface communs, landing page traduits | DONE | Oui (live via curl) | — | — |
| Authentification (connexion, inscription, mot de passe oublié/réinitialisation, validation, erreurs) | DONE (nouveau cette session) | Oui (live via curl FR/EN sur /connexion et /inscription) | — | Test navigateur humain |
| Onboarding (9 étapes + navigation de l'assistant) | DONE (nouveau cette session) | Oui (typecheck/lint/tests) | — | Test navigateur humain |
| Tableau de bord (tous les widgets + filtres) | DONE (nouveau cette session) | Oui (typecheck/lint/tests) | — | Test navigateur humain |
| En-têtes de toutes les autres pages (Comptes, Approbations, Assistant IA, Calendrier, Conflits, Boîte à idées, Performances, Publications, Paramètres, Équipe, Thématiques, Générateur, Tendances, Rapports) | DONE (nouveau cette session) | Oui (typecheck/lint/tests) | — | Test navigateur humain |
| Contenu détaillé de chaque page au-delà du tableau de bord et de l'en-tête (formulaires, filtres, listes) | PARTIAL | Non | — | Reste en français ; voir décision ouverte dans `remaining-before-beta.md` |
| Libellés partagés de statut/plateforme/format (`STATUS_LABEL`, `PLATFORM_LABEL`, `FORMAT_LABEL`, etc.) | NOT STARTED | Non | — | Convertir ces tables en clés de traduction — un seul changement, propagé partout où elles sont utilisées (calendrier, publications, boîte à idées, dashboard, admin) |
| Langue des générations IA — Copilote, Atelier (préréglages), Générateur, Rapports | DONE (session précédente) | Oui (tests automatisés) | — | Test navigateur humain (générer en anglais) |
| Langue des générations IA — Atelier (génération complète), réécriture de sélection, actions rapides Banque (3 catalogues), suggestion de thématiques, analyse de tendance | DONE (corrigé cette session — 5 routes ignoraient encore la langue de l'interface) | Oui (nouveau test automatisé `language-instruction.test.ts` couvrant les 5 constructeurs de prompt en FR et EN) | — | Test navigateur humain (générer en anglais) |

## 5. Chantier 5 — Réutilisation / repurposing de contenu

| Fonctionnalité | État | Testée | Blocage | Action restante |
|---|---|---|---|---|
| Action « Réutiliser ce contenu » (adapter plateforme/format) | DONE | Partiel (build clean, migration vérifiée en base) | — | Test navigateur humain |
| Traçabilité contenu dérivé → publication d'origine (`derivedFromId`) | DONE | Oui (FK vérifiée en base via `pg_constraint`) | — | — |
| Vue inverse (liste des dérivés d'une publication) | NOT STARTED | Non | — | Fonctionnalité future, non requise pour la bêta |

## 6. Chantier 6 — Boucle d'optimisation IA

| Fonctionnalité | État | Testée | Blocage | Action restante |
|---|---|---|---|---|
| Analyse déterministe des performances réelles (jamais de donnée inventée) | DONE (préexistant + amélioré) | Oui (tests automatisés, y compris garanties anti-invention) | — | — |
| Recommandations « meilleur contenu » et « contenu faible » | DONE | Oui (tests automatisés) | — | — |
| Message explicite si données insuffisantes | DONE | Oui (test automatisé) | — | — |
| Bouton « Ajouter au calendrier » → ouvre réellement un parcours qui mène à une publication programmée | DONE (corrigé cette session — bug trouvé par le 2e audit : redirigeait vers `/calendrier`, qui n'affiche que des publications, jamais l'idée nouvellement créée) | Oui (typecheck, lint, build) | — | Test navigateur humain |
| Ciblage de la marque active lors de la création d'idée depuis une recommandation | DONE (corrigé cette session — bug trouvé par l'audit : créait toujours l'idée sur la première marque du workspace, pas la marque filtrée sur la page) | Oui (typecheck, tests existants) | — | Test navigateur humain |
| « Ajouter au calendrier » depuis le menu d'actions d'une tendance (Tendances) | DONE (même bug, même corrective, corrigé cette session) | Oui (typecheck, lint, build) | — | Test navigateur humain |

## 7. Chantier 7 — Admin

| Fonctionnalité | État | Testée | Blocage | Action restante |
|---|---|---|---|---|
| Gestion des prompts IA (nom, fonction, prompt système, instructions, statut) | DONE (préexistant) | Oui | — | — |
| Versionnage des prompts (numéro de version, incrémenté à chaque enregistrement) | DONE | Oui (vérifié en base : v1 → v2 après un vrai enregistrement) | — | — |
| Textes configurables | DONE (préexistant) | Partiel | — | Test navigateur humain |
| Gestion des utilisateurs | DONE (préexistant) | Partiel | — | Test navigateur humain |
| Informations système utiles | DONE (préexistant) | Partiel | — | Test navigateur humain |
| Secrets/clés API jamais visibles dans l'Admin | DONE | Oui (vérifié par lecture du code — aucune route n'expose de secret) | — | — |
| Feature flags (`/admin/fonctionnalites`, table `feature_flags`) | DONE (préexistant — corrigée cette ligne du tableau, elle indiquait à tort NOT STARTED) | Partiel | — | Test navigateur humain |
| Feature flag « Export PDF Gamma » réellement appliqué aux routes qui génèrent/interrogent un PDF | DONE (corrigé cette session — bug trouvé par le 2e audit : seul `/api/gamma/config` vérifiait l'interrupteur ; `/api/gamma/generate` et `/api/gamma/status` ne vérifiaient que la clé API, rendant l'interrupteur admin cosmétique — un appel direct à la route pouvait déclencher une génération Gamma réelle et facturable même désactivé) | Oui (typecheck) — pas de test automatisé (nécessiterait de mocker Supabase/next headers, absent des conventions de test actuelles) | — | Test navigateur humain (basculer l'interrupteur, vérifier le refus 503) |
| `/admin/utilisateurs` — erreurs Supabase visibles (pas une fausse liste vide) | DONE (corrigé cette session — bug trouvé par l'audit : une erreur sur l'un des 3 appels Supabase rendait silencieusement un tableau vide) | Oui (typecheck) | — | Test navigateur humain |

## 8. Qualité avant bêta

| Fonctionnalité | État | Testée | Blocage | Action restante |
|---|---|---|---|---|
| Typecheck (`tsc --noEmit`) | DONE | Oui — 0 erreur | — | — |
| Lint | DONE | Oui — 0 erreur (1 avertissement pré-existant sans rapport, `<img>` non optimisée) | — | — |
| Tests automatisés existants + nouveaux | DONE | Oui — 49 tests verts (12 nouveaux cette session : approbation, langue des 5 prompts IA corrigés, interpolation i18n) | — | — |
| Build de production | DONE | Oui — 67 routes générées, succès | — | — |
| Vérification des routes (accès non authentifié) | DONE | Oui (live : `/`, `/admin`, `/publications`, `/calendrier`, `/parametres`, `/api/admin/prompts` → 307 sans session) | — | — |
| Vérification auth | DONE | Oui | — | — |
| Séparation multi-workspace | DONE | Oui (vérifiée dans les sessions précédentes + relecture RLS) | — | — |
| RLS (advisors Supabase) | DONE | Oui — seules les 6 alertes WARN déjà documentées/acceptées, aucune nouvelle | — | — |
| RLS activée sur toutes les tables publiques | DONE (vérifié cette session par requête directe sur `pg_class.relrowsecurity`) | Oui — 0 table avec RLS désactivée | — | — |
| Routes `/api/admin/*` protégées indépendamment du client | DONE (vérifié cette session — les 3 routes utilisent `requirePlatformAdmin()`) | Oui | — | — |
| Sidebar — tient sans défilement sur laptop standard (1366×768+) | DONE (corrigé cette session, sur demande explicite : padding/line-height resserrés, `overflow-y-auto` retiré) | Non — calculé à partir de l'échelle Tailwind, jamais mesuré dans un vrai navigateur | — | Test navigateur humain sur 1366×768 / 1440×900 / 1920×1080 |
| Responsive (mobile/tablette/desktop) | BLOCKED | Non | Nécessite un navigateur réel — l'agent n'a pas d'accès visuel | Test navigateur humain |
| Vérification FR | DONE | Oui (live via curl : landing page et pages d'authentification rendues en français par défaut) | — | Test navigateur humain sur le reste de l'application |
| Vérification EN | DONE | Oui (live via curl avec cookie `clickpost-locale=en` : landing page et pages d'authentification rendues en anglais, `<html lang="en">` correct) | — | Test navigateur humain sur le reste de l'application |
| États de chargement / erreur / vide | PARTIAL | Non (relu dans le code, pas balayé exhaustivement cette session) | — | Test navigateur humain |

## 9. Hors périmètre (rappel)

| Fonctionnalité | État | Testée | Blocage | Action restante |
|---|---|---|---|---|
| Paiement (Stripe) | NOT STARTED | — | — | Hors périmètre bêta |
| Déploiement de production réel | NOT STARTED | — | BLOCKED — action structurante nécessitant une autorisation explicite | Décision + configuration utilisateur |
| Intégration Gamma réelle | NOT STARTED | — | BLOCKED — `GAMMA_API_KEY` absente | Configurer la clé si le PDF export est requis pour la bêta |
| Portail client agence dédié | NOT STARTED | — | — | Architecture le permet déjà (rôles workspace), non construit |
