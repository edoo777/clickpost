# ClickPost — État produit détaillé

Photographie de l'état réel du produit à la fin de la session autonome du 2026-08-18 (8 chantiers :
audit du parcours existant, workflow de validation, architecture multi-plateformes, i18n FR/EN,
réutilisation de contenu, boucle d'optimisation IA, Admin, qualité). Classification stricte :

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

## 2. Chantier 2 — Workflow de validation/révision

| Fonctionnalité | État | Testée | Blocage | Action restante |
|---|---|---|---|---|
| Statuts Brouillon → À réviser → Modifications demandées → Approuvé → Prêt à programmer → Programmé → Publié | DONE (préexistant, vérifié conforme) | Partiel | — | Test navigateur humain du parcours complet |
| Transitions de statut protégées côté base (trigger) | DONE | Oui (vérifié en base) | — | — |
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

## 4. Chantier 4 — Internationalisation FR/EN

| Fonctionnalité | État | Testée | Blocage | Action restante |
|---|---|---|---|---|
| Architecture i18n centralisée (dictionnaires, `useTranslations`, persistance) | DONE | Oui (SSR vérifié en live via curl, FOUC corrigé) | — | — |
| Sélecteur de langue (barre latérale + barre supérieure) | DONE | Partiel | — | Test navigateur humain |
| Persistance cross-device (`profiles.ui_locale`) | DONE | Oui (migration appliquée, synchronisation vérifiée dans le code) | — | Test navigateur humain (déconnexion/reconnexion) |
| Navigation, éléments d'interface communs, landing page traduits | DONE | Partiel | — | Test navigateur humain dans les deux langues |
| Langue des générations IA (Copilote, Atelier, Générateur, Rapports) | DONE | Oui (tests automatisés sur les instructions générées) | — | Test navigateur humain (générer en anglais) |
| Traduction complète de chaque module (dashboard, calendrier, boîte à idées, etc.) | PARTIAL | Non | — | Décision produit : prioriser les pages à traduire ensuite (voir `remaining-before-beta.md`) |

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
| Bouton → envoi vers générateur d'idées / calendrier | DONE (préexistant, vérifié conforme) | Partiel | — | Test navigateur humain |

## 7. Chantier 7 — Admin

| Fonctionnalité | État | Testée | Blocage | Action restante |
|---|---|---|---|---|
| Gestion des prompts IA (nom, fonction, prompt système, instructions, statut) | DONE (préexistant) | Oui | — | — |
| Versionnage des prompts (numéro de version, incrémenté à chaque enregistrement) | DONE | Oui (vérifié en base : v1 → v2 après un vrai enregistrement) | — | — |
| Textes configurables | DONE (préexistant) | Partiel | — | Test navigateur humain |
| Gestion des utilisateurs | DONE (préexistant) | Partiel | — | Test navigateur humain |
| Informations système utiles | DONE (préexistant) | Partiel | — | Test navigateur humain |
| Secrets/clés API jamais visibles dans l'Admin | DONE | Oui (vérifié par lecture du code — aucune route n'expose de secret) | — | — |
| Feature flags | NOT STARTED | — | — | Aucun système de feature flags n'existe encore dans le produit — à concevoir si besoin futur |

## 8. Chantier 8 — Qualité avant bêta

| Fonctionnalité | État | Testée | Blocage | Action restante |
|---|---|---|---|---|
| Typecheck (`tsc --noEmit`) | DONE | Oui — 0 erreur | — | — |
| Lint | DONE | Oui — 0 erreur | — | — |
| Tests automatisés existants + nouveaux | DONE | Oui — suite vitest verte (dont nouveaux tests providers/optimisation/i18n) | — | — |
| Build de production | DONE | Oui — 67 routes générées, exit 0 | — | — |
| Vérification des routes (24 routes, session admin réelle) | DONE | Oui | — | — |
| Vérification auth (accès non authentifié correctement redirigé) | DONE | Oui | — | — |
| Séparation multi-workspace | DONE | Oui (vérifiée dans les sessions précédentes + relecture RLS) | — | — |
| RLS (advisors Supabase) | DONE | Oui — seules les 6 alertes WARN déjà documentées/acceptées, aucune nouvelle | — | — |
| Responsive (mobile/tablette/desktop) | BLOCKED | Non | Nécessite un navigateur réel — l'agent n'a pas d'accès visuel | Test navigateur humain |
| Vérification FR | PARTIAL | Non (au-delà des tests automatisés d'instructions IA) | — | Test navigateur humain |
| Vérification EN | PARTIAL | Non (au-delà des tests automatisés d'instructions IA) | — | Test navigateur humain |
| États de chargement / erreur / vide | PARTIAL | Non (relu dans le code, pas balayé exhaustivement cette session) | — | Test navigateur humain |

## 9. Hors périmètre (rappel)

| Fonctionnalité | État | Testée | Blocage | Action restante |
|---|---|---|---|---|
| Paiement (Stripe) | NOT STARTED | — | — | Hors périmètre bêta |
| Déploiement de production réel | NOT STARTED | — | BLOCKED — action structurante nécessitant une autorisation explicite | Décision + configuration utilisateur |
| Intégration Gamma réelle | NOT STARTED | — | BLOCKED — `GAMMA_API_KEY` absente | Configurer la clé si le PDF export est requis pour la bêta |
| Portail client agence dédié | NOT STARTED | — | — | Architecture le permet déjà (rôles workspace), non construit |
