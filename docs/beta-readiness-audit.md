# ClickPost — Audit de préparation bêta

Source de vérité : ce document reflète l'état réel du code au moment de la session autonome du
2026-08-17 (interrompue par un redémarrage machine, reprise et terminée le même jour). Il
remplace `docs/clickpost-checkpoint.md` pour tout ce qui concerne l'état fonctionnel — se fier à
celui-ci en cas de contradiction.

Légende : ✅ prêt · ⚠️ à corriger · ❌ bloquant · 🟡 peut attendre après bêta

## Parcours audité

| Étape | État | Détail |
|---|---|---|
| Inscription | ✅ | `signUp()` réel, confirmation par e-mail, message clair, jamais d'auto-connexion avant confirmation. |
| Connexion | ✅ | `signInWithPassword()` réel, erreurs traduites en français. |
| Mot de passe oublié / réinitialisation | ✅ | `resetPasswordForEmail()`/`updateUser()` réels, message générique volontaire (ne révèle jamais si un compte existe). |
| Bootstrap workspace | ✅ | `ensure_default_workspace()` — idempotent, verrouillé par transaction, bug d'ambiguïté de colonne déjà corrigé dans une migration antérieure. |
| Onboarding | ✅ (corrigé cette session) | 9 étapes, seul le nom du workspace est requis. **Bug bloquant corrigé** : un échec de chargement du workspace laissait l'utilisateur sur un spinner infini sans message ni recours — `WorkspaceErrorNotice` + bouton Réessayer maintenant affichés. Titre/sous-titre d'accueil administrables depuis `/admin/textes`. |
| Création de marque | ✅ | Seul le nom est obligatoire ; tous les autres champs (secteur, description, audience, ton, objectifs, thématiques) ont des valeurs par défaut sûres — aucun crash en aval si non renseignés. |
| Thématiques | ✅ | CRUD réel, isolation par marque. |
| Génération de sujets | ✅ | Prompt Claude réel, contexte de marque complet (positionnement, ton, audience, objectifs), anti-doublon contre les sujets existants, angle généré et propagé à l'Idée lors du développement. |
| Angles | ✅ | Champ `angle` présent de bout en bout (génération → sujet → idée → Atelier). |
| Atelier | ✅ | Toutes les actions (génération complète, hooks, plan, angles, réécrire/raccourcir/développer/corriger/simplifier/ton/storytelling, sélection de texte) branchées à Claude réel, avec repli simulé toujours étiqueté. |
| Rédaction IA | ✅ | Voir Atelier + Copilote — jamais de simulation présentée comme une vraie réponse Claude. |
| Publication (CRUD) | ✅ | Statuts réels, verrouillage optimiste. |
| Calendrier | ✅ | Données réelles, jours fériés via API dédiée. |
| Programmation | ✅ | `scheduled_for` en `timestamptz`, conversion de fuseau centralisée. |
| Compte LinkedIn | ✅ | OAuth réel, jetons chiffrés AES-256-GCM, rafraîchissement automatique avec échec explicite (jamais un jeton expiré silencieusement réutilisé). |
| Publication réelle LinkedIn | ✅ (profil perso) / ⏸ (Page pro, en attente d'approbation LinkedIn) | Planificateur réel (Vercel Cron), verrouillage + 3 tentatives. |
| Statistiques disponibles | 🟡 | Import CSV manuel = seule source réelle (portées OAuth LinkedIn actuelles insuffisantes pour les statistiques API). Toujours étiqueté Importé/Démonstration/Non disponible, jamais un faux zéro. |
| Rapports | ✅ | Génération narrative complète (9 sections), édition avant enregistrement, sauvegarde/mise à jour/réouverture/historique tous vérifiés cette session, isolation workspace confirmée par RLS. |
| Historique | ✅ | Rapports précédents listés et rouvrables avec filtres d'origine restaurés. |
| Déconnexion/reconnexion | ✅ | Non modifié cette session — comportement standard Supabase Auth, déjà validé en session précédente. |

## Nouveautés de cette session

- **Espace Admin** (`/admin`) : prompts IA administrables, textes produit curés, vue utilisateurs/
  workspaces, feature flags — voir `docs/admin-guide.md`.
- **Landing page publique** (`/bienvenue`) : présente ClickPost aux futurs bêta-testeurs, aucune
  donnée fabriquée (pas de faux témoignages/chiffres).
- **Modèle éditorial** : cohérence Marque → Thématique → Sujet → Angle → Atelier confirmée saine,
  aucune nouvelle occurrence de `theme-nova-1` ou de fuite de donnée de démonstration trouvée par
  l'audit (le garde-fou générique `stripSeedReferences` couvre toutes les entités synchronisées).

## Ce qui peut attendre après la bêta

- Statistiques LinkedIn réelles (bloqué par une portée OAuth supplémentaire, hors de notre
  contrôle direct).
- Publication sur Page LinkedIn (organisation) — bloqué par l'approbation LinkedIn.
- Autres réseaux sociaux (Instagram, Facebook, TikTok, YouTube) — non développés, feature flags
  préparés mais non fonctionnels.
- Intégration Gamma réelle (PDF) — architecture prête, clé non configurée.
- Historique complet des modifications de prompts/textes admin (une seule marche arrière pour
  l'instant).
- Paiement/abonnement (aucune intégration).

Voir `docs/remaining-before-beta.md` pour la liste stricte de ce qui reste à faire avant
d'inviter 5 à 10 utilisateurs externes.
