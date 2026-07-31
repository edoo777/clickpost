# Fonctionnement offline-first

ClickPost est conçu pour ne jamais attendre le réseau : IndexedDB est la source de vérité locale immédiate, Supabase est une couche de synchronisation additive et réversible.

## Couches

1. **IndexedDB `clickpost-workspace`** (`src/lib/persistence/indexeddb-adapter.ts`) — snapshot complet de l'état applicatif (les 8 magasins React), sauvegarde courante + précédente (jamais d'écrasement sans conservation de la version antérieure). Écriture débouncée (`coordinator.ts`, 800 ms) pour ne jamais bloquer la frappe.

2. **IndexedDB `clickpost-sync-queue`** (`src/lib/sync/queue.ts`) — trois stores :
   - `operations` : file d'attente des envois vers Supabase (FIFO).
   - `sync_state` : dernière révision confirmée par enregistrement, marqueur de conflit.
   - `import_journal` (F1.8) : suivi de progression de l'assistant d'import, additif.

3. **Supabase** — les 11 tables de workspace, jamais consultées de façon bloquante pour l'affichage.

## Push (local → cloud, F1.4)

Chaque magasin synchronisé (`useSyncedPersistedState`) compare son état avant/après à chaque changement et enfile une opération `upsert`/`delete` par identifiant modifié. `processSyncQueue()` vide la file dès que le réseau est disponible, avec contrôle de concurrence optimiste (`UPDATE ... WHERE revision = <attendue>` — 0 ligne affectée = conflit).

## Pull et fusion (cloud → local, F1.6)

Une fois par session, dès que le workspace est résolu : une requête par entité, filtrée sur le workspace actif, fusionnée dans l'état déjà monté des magasins (jamais dans une nouvelle lecture IndexedDB qui laisserait l'UI obsolète). Dernier `updated_at` gagnant, jamais d'écrasement d'un enregistrement encore en attente d'envoi ou déjà en conflit.

## Conflits (F1.7)

Détectés automatiquement par le mécanisme d'écriture optimiste, résolus depuis le Centre des conflits (`/conflits`) : comparaison champ par champ, conserver local/distant/fusion manuelle, jamais de décision automatique sur la seule base de `updated_at`, jamais de perte silencieuse (les deux versions sont conservées jusqu'à résolution explicite).

## Import des anciennes données (F1.8)

Un enregistrement local sans entrée `sync_state` et absent de la file d'attente est une donnée antérieure à l'activation de la synchronisation. L'assistant (Paramètres → Données et confidentialité) permet de l'importer explicitement, par lots ordonnés selon les dépendances, en réutilisant la file existante (aucun second moteur).

## Multi-onglets

`BroadcastChannel` notifie les autres onglets d'une sauvegarde locale ou d'un changement de file — jamais de fusion automatique entre onglets, seulement une notification informative.
