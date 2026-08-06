# Configuration des plateformes sociales — ClickPost

**LinkedIn dispose désormais d'une intégration API réelle**, confirmée par un premier test
complet (connexion, publication réelle, planificateur) — voir
`docs/linkedin-production-readiness.md` pour l'état d'ensemble à jour (ce qui fonctionne
réellement, permissions, limites, tests restants) et `docs/linkedin-test-integration.md` pour
l'architecture détaillée du pilote initial. Pour toutes les autres plateformes ci-dessous, rien
n'a changé : aucune intégration API
réelle n'existe encore. C'est volontaire : ClickPost n'affiche jamais un envoi automatique qui n'a
pas réellement eu lieu. Ce document explique l'architecture déjà en place et la procédure à suivre
pour brancher une vraie intégration, plateforme par plateforme, quand vous serez prêt — LinkedIn
sert désormais de référence concrète pour ce travail.

## Architecture existante

- **Abstraction commune** : `src/types/publishing-provider.ts` (interface `PublishProvider`) et
  `src/lib/publishing/providers.ts` (registre par plateforme, `getPublishProvider(platform)`).
  Aujourd'hui, chaque plateforme renvoie un fournisseur « non configuré » (`isConfigured()` vaut
  toujours `false`) — l'interface guide systématiquement vers la publication manuelle.
- **Contraintes par plateforme** : `src/lib/publishing/platform-constraints.ts` — limites de
  longueur de texte, nombre de hashtags, nombre et type de médias. Valeurs publiques connues,
  volontairement indicatives (à revérifier auprès de chaque plateforme, qui les fait évoluer sans
  préavis).
- **Publication manuelle** : `src/components/publications/ManualPublishPanel.tsx` — pour toute
  publication au statut « Programmé », propose de copier le texte, télécharger les médias, puis
  confirmer explicitement une publication réellement effectuée par un humain (ou signaler un
  échec avec un motif). Chaque confirmation est journalisée dans
  `Publication.publishAttempts` (mode `manual`/`automatic`, statut, auteur, date, message d'erreur).
- **États de préparation** (`PublishReadiness`, `src/types/publishing-provider.ts`) : Non connecté,
  Connexion requise, Action manuelle requise, Contraintes non respectées, Prêt, Publication en
  cours, Publié, Échec — calculés par `computePublishReadiness()` à partir de faits vérifiables
  (statut du compte, contraintes, configuration du fournisseur), jamais optimistes par défaut.
- **Comptes sociaux** (`src/types/dashboard.ts`, table `accounts`) : `AccountStatus` inclut
  `connected`/`syncing`/`expired`/`error`/`insufficient_permission`. Pour LinkedIn, ces statuts
  sont désormais réellement écrits par l'application après une confirmation OAuth effective (voir
  `docs/linkedin-test-integration.md`). Pour les autres plateformes, seul `profile_only` est
  encore écrit (« Profil renseigné — connexion API non configurée »). Ne jamais faire passer un
  compte à `connected` sans une confirmation OAuth/API réelle.

## Pour brancher une plateforme réelle

Chaque réseau nécessite un compte développeur, une application enregistrée, et des identifiants
distincts. Aucun de ces comptes n'existe dans ce projet — ils doivent être créés par vous, hors de
ClickPost.

| Plateforme | Portail développeur | Notes |
|---|---|---|
| Instagram / Facebook | developers.facebook.com | Une seule « Meta App » couvre les deux ; revue par Meta requise pour les permissions de publication (`instagram_content_publish`, `pages_manage_posts`). |
| LinkedIn | developer.linkedin.com | **Intégration pilote déjà implémentée** — voir `docs/linkedin-test-integration.md` pour la procédure de connexion réelle (produit « Share on LinkedIn », portées `openid profile email w_member_social`). |
| TikTok | developers.tiktok.com | « Content Posting API » — accès sur demande, revue TikTok requise. |
| X | developer.x.com | Niveau d'accès payant requis pour la publication programmatique. |
| YouTube | console.cloud.google.com (déjà utilisé pour `YOUTUBE_API_KEY`, lecture seule) | La publication de vidéos nécessite OAuth2 (pas seulement une clé API) et le scope `youtube.upload`. |
| Threads | developers.facebook.com (Threads API) | Compte développeur Meta distinct requis. |
| Pinterest | developers.pinterest.com | « Pinterest API » — accès sur demande. |

### Étapes générales, par plateforme

1. Créer le compte développeur et l'application sur le portail ci-dessus.
2. Configurer le flux OAuth (URL de redirection vers ClickPost — à définir lors de
   l'implémentation de la connexion de compte réelle, hors périmètre actuel).
3. Ajouter les variables d'environnement nécessaires côté serveur uniquement (jamais
   `NEXT_PUBLIC_*`) — voir `.env.example` pour le patron déjà utilisé (Anthropic, YouTube).
4. Implémenter un `PublishProvider` réel dans `src/lib/publishing/providers.ts` pour cette
   plateforme (remplacer le fournisseur « non configuré » par un appel réel à l'API), en
   conservant la même interface — aucun autre fichier de l'application n'a besoin de changer.
5. Mettre à jour `AccountStatus` réel des comptes concernés uniquement après une confirmation
   OAuth effective (jamais avant).

### Limites connues (ce projet, aujourd'hui)

- LinkedIn dispose d'une connexion OAuth réelle (pilote) — voir
  `docs/linkedin-test-integration.md` pour son périmètre exact et ses limites propres
  (statistiques indisponibles avec les portées minimales, vidéo non supportée, etc.).
- Aucune autre plateforme sociale n'a de connexion OAuth réelle.
- La publication reste entièrement manuelle pour ces autres plateformes (confirmation humaine
  après action réelle sur la plateforme) tant qu'aucun fournisseur n'est branché.
- Les limites de `platform-constraints.ts` sont indicatives, pas garanties exactes.
