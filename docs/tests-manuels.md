# Tests manuels (F1.9)

Parcours de référence pour valider une version avant mise en production, ou pour une régression après changement significatif. Nécessite un accès navigateur — à exécuter par un humain (aucun test automatisé n'existe, voir [limites-connues.md](./limites-connues.md)).

## A. Parcours de bout en bout (un seul compte)

1. Inscription avec un nouvel e-mail → confirmation du courriel → connexion.
2. Onboarding → vérifier la création automatique du workspace (une seule fois, jamais redemandée aux connexions suivantes).
3. Créer une marque, la sélectionner comme active, actualiser la page → elle doit rester active.
4. Créer un compte social, une campagne, une thématique, une idée.
5. Ouvrir l'Atelier depuis l'idée → écrire, utiliser une commande IA simulée, créer une version.
6. Transformer l'idée en publication, planifier une date/heure.
7. Vérifier l'indicateur de sauvegarde (état local) puis de synchronisation (état cloud) après chaque étape.
8. DevTools → Network → Offline : continuer à créer/modifier → l'état doit passer à « en attente », jamais d'erreur bloquante.
9. Repasser en ligne → vérifier la reprise automatique et le passage à « Synchronisé ».
10. Ouvrir un second onglet (même compte) → actualiser → la donnée créée dans l'onglet 1 doit apparaître (pull au démarrage).
11. Modifier le même élément dans les deux onglets avant resynchronisation → vérifier la détection du conflit et sa résolution via `/conflits`.
12. Paramètres → Données et confidentialité → tester l'assistant d'import s'il existe d'anciennes données locales.
13. Déconnexion → reconnexion → vérifier que marque active, thème et état de la sidebar sont restaurés.

## B. Multi-utilisateurs et isolation

1. Créer un compte B distinct (navigation privée ou second navigateur) → workspace par défaut propre.
2. Compte A crée une marque/idée/publication → compte B ne doit **jamais** la voir (tableau de bord, calendrier, marques, conflits, performances).
3. Deux onglets du **même** compte modifiant le même élément simultanément → conflit détecté, aucune donnée écrasée silencieusement.
4. Si plusieurs rôles existent dans un même workspace : un membre non-admin ne doit pas pouvoir créer/modifier/archiver une marque — le bouton doit être visiblement désactivé, pas seulement refusé en silence.
5. Relever l'identifiant d'une marque du compte A, tenter `/marques/<id>` connecté en tant que B → doit afficher « introuvable », jamais les données.

## F. Interface et responsive

- Redimensionner : grand écran, petit ordinateur portable, tablette, mobile.
- Sidebar : ouverte, réduite (bouton et Ctrl+B), redimensionnée manuellement (glisser-déposer, persistance après actualisation).
- Barre supérieure : titre de page, sélecteur de marque, accès Gestion (boutons ou menu selon largeur).
- Thèmes clair, sombre, système (bascule immédiate, cohérente entre sidebar/barre/contenu).
- Navigation clavier (Tab) et focus visibles sur les boutons/liens principaux.
- Aucun débordement horizontal à aucune largeur testée.
- États à vérifier sur au moins une page représentative chacun : chargement, vide (ex. aucune marque), erreur, hors ligne, synchronisation en cours, conflit.

## G. Gestion des erreurs

- Bloquer le domaine Supabase dans DevTools → l'application doit rester utilisable hors ligne, messages clairs (pas de blocage total de l'UI).
- Couper le réseau puis le rétablir → reprise automatique sans action utilisateur.
- Session expirée (attendre ou invalider manuellement) → redirection propre vers la connexion, pas d'état incohérent.
- Tenter une action refusée par RLS (ex. créer une marque avec un compte non-admin) → message compréhensible, jamais un détail technique brut (SQL, clé, stack trace).
- Soumettre un formulaire avec des données invalides → validation claire.
- Provoquer un conflit concurrent (voir A.11) → jamais de perte silencieuse.
- Import (F1.8) avec une dépendance manquante ou hors ligne → état « à reprendre », jamais faussement « importé ».
- Actualiser la page en cours d'opération (sauvegarde, synchronisation) → aucune corruption d'état au retour.

## Après chaque campagne de test

Consigner ici toute régression trouvée, avec le commit sur lequel elle a été observée — ce fichier est un outil vivant, pas un rapport figé.
