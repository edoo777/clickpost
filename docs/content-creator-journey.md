# Parcours du créateur de contenu — ClickPost

Ce document décrit le parcours éditorial complet tel qu'il existe réellement dans le code
aujourd'hui — pas un objectif futur. Chaque étape indique où elle se trouve dans l'interface et
son état réel (fonctionnel, manuel, ou en attente d'une intégration externe).

## Vue d'ensemble

```
Marque → Stratégie → Thématiques → Tendances → Idées → Note → Conversion → Publication
  → Médias → Révision → Approbation → Planification → Publication (manuelle) → Promotion
  → Analyse → Optimisation → Recyclage
```

L'information circule d'une étape à l'autre sans copie manuelle : une tendance devient
directement une idée ou une note ; une note devient une idée puis une publication ; une
publication publiée peut être recyclée en nouvelle idée.

## Détail étape par étape

1. **Créer une marque** — `/marques` → « + Nouvelle marque ». Un seul système de marque dans
   toute l'application (jamais dupliqué).
2. **Définir la stratégie éditoriale** — fiche marque, onglet « Positionnement » : niche,
   positionnement, proposition de valeur, audience, problèmes de l'audience, objectifs, ton,
   langue, fréquence et objectif mensuel de publication, sujets/mots à éviter ou privilégier.
   Indicateur de complétion visible.
3. **Configurer les thématiques** — fiche marque, onglet « Thématiques ».
4. **Consulter les tendances** — `/tendances`. Sources officielles (YouTube Data API, flux RSS
   officiels des plateformes) en priorité ; recherche Web via Claude en complément, uniquement
   sur déclenchement manuel, jamais automatique. Chaque tendance propose 9 actions directes :
   Générer des idées, Créer une note, Créer une publication, Ajouter au calendrier, etc.
5. **Générer des idées** — `/boite-idees` (onglet Générateur), assisté par Claude ou manuel.
6. **Rédiger une note libre** — `/boite-idees` (onglet Banque), éditeur de type Notion.
7. **Convertir en idée** — bouton dans l'éditeur de note ; dé-duplication garantie (jamais deux
   idées pour une même note).
8. **Créer la publication** — Atelier (`/atelier/[id]`) → « Transformer en publication », ou
   directement `/publications/new`. Deux modes : manuel ou assisté par Claude (aperçu avant
   application, jamais d'écrasement silencieux).
9. **Téléverser les médias** — glisser-déposer réel vers Supabase Storage (bucket privé, URLs
   signées), limites 10 Mo/image, 200 Mo/vidéo, 8 médias maximum.
10. **Envoyer en révision** — bouton de progression contextuel sur la fiche publication ou dans
    l'Atelier.
11. **Approuver** — `/approbations` ou directement sur la fiche publication ; réservé à
    l'approbateur désigné ou à un administrateur du workspace. Une publication déjà approuvée qui
    est modifiée repasse automatiquement en révision (jamais de modification silencieuse).
12. **Planifier** — statut « Programmé », date/heure et fuseau horaire choisis sur la fiche
    publication. Pour LinkedIn, le planificateur réel (`/api/cron/linkedin-publish`, voir
    `docs/linkedin-production-readiness.md`) publie automatiquement à l'heure prévue, dans le
    fuseau choisi.
13. **Publier** — **LinkedIn (profil personnel connecté)** : réellement automatique, via le
    bouton « Publier via LinkedIn » (immédiat) ou le planificateur (programmé) — statut « Publié »
    jamais affiché sans confirmation réelle de LinkedIn (identifiant de post réel, lien direct
    affiché sur la fiche). Pages LinkedIn administrées : architecture prête, en attente de
    l'approbation LinkedIn (voir Phase 4). **Toutes les autres plateformes** : manuel aujourd'hui,
    panneau « Publication manuelle » sur la fiche, avec copie du texte, téléchargement des médias,
    checklist, puis confirmation explicite — ne prétend jamais qu'un envoi automatique a eu lieu.
14. **Promouvoir** — checklist de promotion générée automatiquement à la publication (repartage
    en story, diffusion communautaire, réponse aux commentaires, mention d'un partenaire, demande
    de partage à l'équipe, recyclage, relance différée, promotion payante facultative), visible
    sur la fiche publication et dans l'onglet « Promotion » de `/publications`.
15. **Analyser** — `/performances`. Seul le nombre de publications réellement « Publié » est
    garanti réel sans configuration supplémentaire ; toute autre statistique provient d'un import
    CSV manuel (modèle fourni, identifiants de publication réels obligatoires) ou, si activées
    explicitement, de données de démonstration clairement étiquetées.
16. **Optimiser** — onglet « Optimisation » de `/performances` : recommandations typées (constat /
    recommandation / hypothèse à tester), chacune avec sa justification et des actions réelles
    (Transformer en nouvelle idée, Recycler, Créer une variante, Ajouter au calendrier, Créer un
    test, Ignorer).
17. **Recycler** — depuis une publication publiée (bouton « Recycler en nouvelle idée ») ou depuis
    une recommandation d'optimisation — referme la boucle vers l'étape 5.

## Ce qui est réel aujourd'hui vs ce qui attend une intégration externe

| Étape | État |
|---|---|
| 1–12 (marque → planification) | Entièrement fonctionnel, données réelles. |
| 13 (publication) | LinkedIn (profil personnel) : réel, automatique, immédiat ou programmé. Autres plateformes : mode manuel uniquement — aucune autre API sociale connectée. |
| 14 (promotion) | Fonctionnel, checklist réelle rattachée à la publication. |
| 15 (analyse) | Fonctionnel pour le nombre de publications ; le reste nécessite un import CSV ou reste à zéro. |
| 16 (optimisation) | Fonctionnel, calculs déterministes sur les données déjà affichées. |
| 17 (recyclage) | Fonctionnel. |

## Progression sans surcharge de la barre latérale

Aucune nouvelle entrée de barre latérale n'a été ajoutée pour les Phases D à I — chaque
fonctionnalité a été intégrée dans une page existante (onglets, boutons contextuels, panneaux) :
publication manuelle et promotion sur la fiche publication existante, onglet Promotion dans le
sélecteur de vues des publications existant, onglet Optimisation dans `/performances` existant.
