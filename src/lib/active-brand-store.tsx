"use client";

import { useSyncExternalStore } from "react";

export const ACTIVE_BRAND_STORAGE_KEY = "clickpost-active-brand";

type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function readStoredActiveBrandId(): string | null {
  return window.localStorage.getItem(ACTIVE_BRAND_STORAGE_KEY);
}

function subscribe(callback: Listener) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): string | null {
  return readStoredActiveBrandId();
}

function getServerSnapshot(): string | null {
  return null;
}

/**
 * Préférence d'appareil pure (même patron que le thème/la sidebar) : la marque active
 * sélectionnée n'est jamais synchronisée avec Supabase, seulement conservée localement
 * et propagée entre onglets via l'évènement natif "storage".
 */
export function setStoredActiveBrandId(id: string | null) {
  if (id) window.localStorage.setItem(ACTIVE_BRAND_STORAGE_KEY, id);
  else window.localStorage.removeItem(ACTIVE_BRAND_STORAGE_KEY);
  notifyListeners();
}

export function useStoredActiveBrandId(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
