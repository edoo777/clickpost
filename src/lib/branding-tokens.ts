import { CLICKPOST_DEFAULT_BRANDING, type WorkspaceBrandingRow } from "@/lib/supabase/types";

export const BRANDING_STORAGE_KEY = "clickpost-branding";

const RADIUS_MAP: Record<WorkspaceBrandingRow["radius"], string> = {
  none: "0px",
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  full: "9999px",
};

/**
 * Applique l'identité visuelle du workspace sous forme de jetons CSS dynamiques
 * (--brand-*), distincts des jetons clair/sombre existants (--primary, --accent…)
 * qui régissent le chrome de l'interface indépendamment de la marque.
 */
export function applyBrandingTokens(branding: WorkspaceBrandingRow) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--brand-primary", branding.color_primary);
  root.style.setProperty("--brand-secondary", branding.color_secondary);
  root.style.setProperty("--brand-accent", branding.color_accent);
  root.style.setProperty("--brand-sidebar", branding.color_sidebar);
  root.style.setProperty("--brand-button", branding.color_button);
  root.style.setProperty("--brand-link", branding.color_link);
  root.style.setProperty("--brand-font-heading", branding.font_heading);
  root.style.setProperty("--brand-font-body", branding.font_body);
  root.style.setProperty("--brand-radius", RADIUS_MAP[branding.radius] ?? RADIUS_MAP.lg);
}

export function cacheBrandingLocally(workspaceId: string, branding: WorkspaceBrandingRow) {
  try {
    window.localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify({ workspaceId, branding }));
  } catch {
    // Cache best-effort — l'absence de cache ne doit jamais bloquer l'application.
  }
}

export function readCachedBranding(workspaceId: string | null): WorkspaceBrandingRow | null {
  try {
    const raw = window.localStorage.getItem(BRANDING_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { workspaceId: string; branding: WorkspaceBrandingRow };
    if (workspaceId && parsed.workspaceId !== workspaceId) return null;
    return parsed.branding;
  } catch {
    return null;
  }
}

export function buildDefaultBranding(workspaceId: string): WorkspaceBrandingRow {
  return { ...CLICKPOST_DEFAULT_BRANDING, workspace_id: workspaceId, updated_at: new Date().toISOString() };
}
