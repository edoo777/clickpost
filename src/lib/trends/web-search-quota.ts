import type { QuotaWindowStatus, WebSearchQuotaStatus, WebSearchUsageSnapshot } from "@/types/trend";

/**
 * Quotas de veille Web — en mémoire processus, même limite assumée que rate-limit.ts et
 * cache.ts (réinitialisé au redémarrage, non partagé entre plusieurs instances). Trois fenêtres
 * indépendantes, cumulatives : une recherche globale ne consomme que le quota global ; une
 * recherche ciblée doit respecter À LA FOIS le quota workspace/jour ET le quota utilisateur/heure.
 * Valeurs MVP fournies par le produit — modifiables par Owner/Admin dans une phase ultérieure
 * (paramètres, hors MVP), jamais codées ailleurs que dans ce module.
 */

const GLOBAL_WINDOW_MS = 2 * 60 * 60_000;
const GLOBAL_MAX = 1;
const TARGETED_WORKSPACE_WINDOW_MS = 24 * 60 * 60_000;
const TARGETED_WORKSPACE_MAX = 5;
const TARGETED_USER_WINDOW_MS = 60 * 60_000;
const TARGETED_USER_MAX = 2;

interface Window {
  count: number;
  windowStart: number;
}

const globalByWorkspace = new Map<string, Window>();
const targetedByWorkspace = new Map<string, Window>();
const targetedByUser = new Map<string, Window>();

interface Usage {
  searchesUsedToday: number;
  cacheHitsToday: number;
  providerErrorsToday: number;
  dayStart: number;
}

const usageByWorkspace = new Map<string, Usage>();
const DAY_MS = 24 * 60 * 60_000;

function peekWindow(map: Map<string, Window>, key: string, windowMs: number, max: number, now: number): QuotaWindowStatus {
  const entry = map.get(key);
  if (!entry || now - entry.windowStart >= windowMs) {
    return { remaining: max, limit: max, resetAt: new Date(now + windowMs).toISOString() };
  }
  return { remaining: Math.max(0, max - entry.count), limit: max, resetAt: new Date(entry.windowStart + windowMs).toISOString() };
}

function consumeWindow(map: Map<string, Window>, key: string, windowMs: number, max: number, now: number): { allowed: boolean; status: QuotaWindowStatus } {
  const entry = map.get(key);
  if (!entry || now - entry.windowStart >= windowMs) {
    map.set(key, { count: 1, windowStart: now });
    return { allowed: true, status: { remaining: max - 1, limit: max, resetAt: new Date(now + windowMs).toISOString() } };
  }
  if (entry.count >= max) {
    return { allowed: false, status: { remaining: 0, limit: max, resetAt: new Date(entry.windowStart + windowMs).toISOString() } };
  }
  entry.count += 1;
  return { allowed: true, status: { remaining: max - entry.count, limit: max, resetAt: new Date(entry.windowStart + windowMs).toISOString() } };
}

function getUsage(workspaceId: string, now: number): Usage {
  const existing = usageByWorkspace.get(workspaceId);
  if (!existing || now - existing.dayStart >= DAY_MS) {
    const fresh: Usage = { searchesUsedToday: 0, cacheHitsToday: 0, providerErrorsToday: 0, dayStart: now };
    usageByWorkspace.set(workspaceId, fresh);
    return fresh;
  }
  return existing;
}

/** Ne consomme rien — pour l'affichage du statut avant tout clic. */
export function peekQuotaStatus(workspaceId: string, userId: string): WebSearchQuotaStatus {
  const now = Date.now();
  return {
    global: peekWindow(globalByWorkspace, workspaceId, GLOBAL_WINDOW_MS, GLOBAL_MAX, now),
    targetedWorkspace: peekWindow(targetedByWorkspace, workspaceId, TARGETED_WORKSPACE_WINDOW_MS, TARGETED_WORKSPACE_MAX, now),
    targetedUser: peekWindow(targetedByUser, `${workspaceId}:${userId}`, TARGETED_USER_WINDOW_MS, TARGETED_USER_MAX, now),
  };
}

export type QuotaCheckResult = { allowed: true } | { allowed: false; resetAt: string; window: "global" | "targeted_workspace" | "targeted_user" };

/** Consomme le(s) quota(s) requis pour le mode demandé — jamais partiel : si un seul échoue,
 * aucun n'est consommé. */
export function consumeSearchQuota(mode: "global" | "targeted", workspaceId: string, userId: string): QuotaCheckResult {
  const now = Date.now();

  if (mode === "global") {
    const check = peekWindow(globalByWorkspace, workspaceId, GLOBAL_WINDOW_MS, GLOBAL_MAX, now);
    if (check.remaining <= 0) return { allowed: false, resetAt: check.resetAt, window: "global" };
    consumeWindow(globalByWorkspace, workspaceId, GLOBAL_WINDOW_MS, GLOBAL_MAX, now);
    return { allowed: true };
  }

  const workspaceCheck = peekWindow(targetedByWorkspace, workspaceId, TARGETED_WORKSPACE_WINDOW_MS, TARGETED_WORKSPACE_MAX, now);
  if (workspaceCheck.remaining <= 0) return { allowed: false, resetAt: workspaceCheck.resetAt, window: "targeted_workspace" };

  const userKey = `${workspaceId}:${userId}`;
  const userCheck = peekWindow(targetedByUser, userKey, TARGETED_USER_WINDOW_MS, TARGETED_USER_MAX, now);
  if (userCheck.remaining <= 0) return { allowed: false, resetAt: userCheck.resetAt, window: "targeted_user" };

  consumeWindow(targetedByWorkspace, workspaceId, TARGETED_WORKSPACE_WINDOW_MS, TARGETED_WORKSPACE_MAX, now);
  consumeWindow(targetedByUser, userKey, TARGETED_USER_WINDOW_MS, TARGETED_USER_MAX, now);
  return { allowed: true };
}

export function recordSearchUsed(workspaceId: string): void {
  const usage = getUsage(workspaceId, Date.now());
  usage.searchesUsedToday += 1;
}

export function recordCacheHit(workspaceId: string): void {
  const usage = getUsage(workspaceId, Date.now());
  usage.cacheHitsToday += 1;
}

export function recordProviderError(workspaceId: string): void {
  const usage = getUsage(workspaceId, Date.now());
  usage.providerErrorsToday += 1;
}

export function getUsageSnapshot(workspaceId: string): WebSearchUsageSnapshot {
  const usage = getUsage(workspaceId, Date.now());
  return {
    searchesUsedToday: usage.searchesUsedToday,
    cacheHitsToday: usage.cacheHitsToday,
    providerErrorsToday: usage.providerErrorsToday,
    lastResetAt: new Date(usage.dayStart).toISOString(),
  };
}
