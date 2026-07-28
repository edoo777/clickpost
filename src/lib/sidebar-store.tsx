"use client";

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";

export const SIDEBAR_STORAGE_KEY = "clickpost-sidebar-collapsed";
export const SIDEBAR_EXPANDED_WIDTH = "16rem";
export const SIDEBAR_COLLAPSED_WIDTH = "5rem";

type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function readStoredCollapsed(): boolean {
  return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
}

function subscribe(callback: Listener) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): boolean {
  return readStoredCollapsed();
}

function getServerSnapshot(): boolean {
  return false;
}

/** Source de vérité unique : écrit dans localStorage puis notifie tous les abonnés. */
export function setSidebarCollapsed(next: boolean) {
  window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
  notifyListeners();
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}

interface SidebarContextValue {
  isCollapsed: boolean;
  setCollapsed: (next: boolean) => void;
  toggleCollapsed: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

/**
 * État central unique pour l'affichage réduit/déployé de la sidebar desktop, avec persistance
 * localStorage (via useSyncExternalStore, donc sans mismatch d'hydratation) et le raccourci
 * clavier global Ctrl+B / Cmd+B, désactivé quand le focus est dans un champ éditable.
 */
export function SidebarStateProvider({ children }: { children: ReactNode }) {
  const isCollapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleCollapsed = useCallback(() => {
    setSidebarCollapsed(!readStoredCollapsed());
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b";
      if (!isShortcut) return;
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
      toggleCollapsed();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleCollapsed]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-w",
      isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH
    );
  }, [isCollapsed]);

  const value: SidebarContextValue = { isCollapsed, setCollapsed: setSidebarCollapsed, toggleCollapsed };

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebarState() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarState must be used within a SidebarStateProvider");
  }
  return context;
}
