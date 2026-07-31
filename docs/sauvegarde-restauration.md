# Sauvegarde et restauration

Accessible depuis **Paramètres → Données et confidentialité**.

## Exporter

« Exporter mes données » télécharge un fichier JSON horodaté contenant l'intégralité du snapshot local (les 11 entités synchronisées + préférences locales thème/sidebar). Aucune information n'est envoyée à un serveur pour cette opération — génération et téléchargement entièrement côté client (`buildExportBackup`/`downloadBackupFile`, `src/lib/persistence/coordinator.ts`).

## Importer une sauvegarde (fichier)

« Importer une sauvegarde » restaure un fichier JSON précédemment exporté. L'état local actuel est automatiquement conservé comme sauvegarde « précédente » avant remplacement (jamais perdu, même en cas d'échec de l'import). La page se recharge pour appliquer les données restaurées.

## Importer mes anciennes données locales (cloud)

À distinguer de l'import de fichier ci-dessus : cette action (assistant dédié, voir [offline-first.md](./offline-first.md#import-des-anciennes-données-f18)) envoie vers Supabase des données qui n'existent aujourd'hui que dans IndexedDB — une sauvegarde JSON est systématiquement proposée avant toute confirmation.

## Effacer les données locales

Efface IndexedDB et les préférences locales sur cet appareil uniquement — n'affecte jamais les données déjà synchronisées sur Supabase. Action irréversible côté appareil, confirmation explicite requise.

## Ce qui n'est jamais automatique

- Aucune donnée locale n'est jamais supprimée automatiquement par le moteur de synchronisation, le pull, la résolution de conflits ou l'assistant d'import — uniquement par une action explicite de l'utilisateur (bouton « Effacer les données locales »).
- Un import (fichier ou cloud) ne remplace jamais silencieusement — la sauvegarde précédente est toujours conservée.
