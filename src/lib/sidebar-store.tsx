"use client";

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";

export const SIDEBAR_STORAGE_KEY = "clickpost-sidebar-collapsed";
export const SIDEBAR_WIDTH_STORAGE_KEY = "clickpost-sidebar-width";
export const SIDEBAR_COLLAPSED_WIDTH = "5rem";
export const SIDEBAR_MIN_WIDTH = 260;
export const SIDEBAR_MAX_WIDTH = 480;
export const SIDEBAR_DEFAULT_WIDTH = 320;

type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export function clampSidebarWidth(width: number): number {
  return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, width));
}

function readStoredCollapsed(): boolean {
  return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
}

function readStoredWidth(): number {
  const stored = Number(window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY));
  return Number.isFinite(stored) && stored > 0 ? clampSidebarWidth(stored) : SIDEBAR_DEFAULT_WIDTH;
}

function subscribe(callback: Listener) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function getCollapsedSnapshot(): boolean {
  return readStoredCollapsed();
}

function getCollapsedServerSnapshot(): boolean {
  return false;
}

function getWidthSnapshot(): number {
  return readStoredWidth();
}

function getWidthServerSnapshot(): number {
  return SIDEBAR_DEFAULT_WIDTH;
}

/** Source de vérité unique pour l'état réduit/déployé : écrit dans localStorage puis notifie tous les abonnés. */
export function setSidebarCollapsed(next: boolean) {
  window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
  notifyListeners();
}

/**
 * Source de vérité unique pour la largeur ouverte choisie par glisser-déposer — préférence
 * locale d'appareil (comme le thème), jamais synchronisée avec Supabase. Le mode réduit ne
 * modifie jamais cette valeur : Ctrl+B / le bouton Réduire ne font que basculer l'affichage,
 * la dernière largeur personnalisée est donc automatiquement restaurée au redéploiement.
 */
export function setSidebarWidth(next: number) {
  window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(clampSidebarWidth(next)));
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
  width: number;
  setCollapsed: (next: boolean) => void;
  toggleCollapsed: () => void;
  setWidth: (next: number) => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

/**
 * État central unique pour l'affichage réduit/déployé et la largeur de la sidebar desktop,
 * avec persistance localStorage (via useSyncExternalStore, donc sans mismatch d'hydratation),
 * synchronisation cross-tab (évènement "storage"), et le raccourci clavier global Ctrl+B / Cmd+B,
 * désactivé quand le focus est dans un champ éditable.
 */
export function SidebarStateProvider({ children }: { children: ReactNode }) {
  const isCollapsed = useSyncExternalStore(subscribe, getCollapsedSnapshot, getCollapsedServerSnapshot);
  const width = useSyncExternalStore(subscribe, getWidthSnapshot, getWidthServerSnapshot);

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
      isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : `${width}px`
    );
  }, [isCollapsed, width]);

  const value: SidebarContextValue = {
    isCollapsed,
    width,
    setCollapsed: setSidebarCollapsed,
    toggleCollapsed,
    setWidth: setSidebarWidth,
  };

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebarState() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarState must be used within a SidebarStateProvider");
  }
  return context;
}
