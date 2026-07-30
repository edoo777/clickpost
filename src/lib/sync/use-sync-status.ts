"use client";

import { useSyncExternalStore } from "react";
import { getSyncStatusServerSnapshot, getSyncStatusSnapshot, subscribeSyncStatus } from "@/lib/sync/runtime";

/** Statut de synchronisation partagé (F1.4/F1.6/F1.7) — source unique, réutilisée par
 * `SaveStatusIndicator`, la barre supérieure et le menu de gestion pour afficher le badge
 * de conflits sans dupliquer l'abonnement `useSyncExternalStore`. */
export function useSyncStatus() {
  return useSyncExternalStore(subscribeSyncStatus, getSyncStatusSnapshot, getSyncStatusServerSnapshot);
}
