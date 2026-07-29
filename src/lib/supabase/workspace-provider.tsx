"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { applyBrandingTokens, buildDefaultBranding, cacheBrandingLocally, readCachedBranding } from "@/lib/branding-tokens";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ProfileRow, WorkspaceBrandingRow, WorkspaceRow } from "@/lib/supabase/types";

interface UpdateResult {
  error: string | null;
}

interface WorkspaceSessionValue {
  userId: string | null;
  email: string;
  profile: ProfileRow | null;
  workspace: WorkspaceRow | null;
  branding: WorkspaceBrandingRow | null;
  isLoading: boolean;
  isAdmin: boolean;
  refresh: () => Promise<void>;
  updateProfile: (patch: Partial<ProfileRow>) => Promise<UpdateResult>;
  updateWorkspace: (patch: Partial<WorkspaceRow>) => Promise<UpdateResult>;
  updateBranding: (patch: Partial<WorkspaceBrandingRow>) => Promise<UpdateResult>;
}

const WorkspaceSessionContext = createContext<WorkspaceSessionValue | null>(null);

/**
 * Charge le profil, le workspace actif et son identité visuelle depuis Supabase.
 * Déclenche `ensure_default_workspace()` (idempotent côté base) si l'utilisateur n'a
 * pas encore de workspace actif, et redirige vers /onboarding uniquement la toute
 * première fois (jamais à chaque connexion suivante). Ne remplace ni IndexedDB ni
 * les magasins locaux existants — c'est une source de données Supabase distincte.
 */
export function WorkspaceSessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceRow | null>(null);
  const [branding, setBranding] = useState<WorkspaceBrandingRow | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasBootstrapped = useRef(false);

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUserId(null);
      setProfile(null);
      setWorkspace(null);
      setBranding(null);
      setRole(null);
      setIsLoading(false);
      return;
    }

    setUserId(user.id);
    setEmail(user.email ?? "");

    const cached = readCachedBranding(null);
    if (cached) applyBrandingTokens(cached);

    const { data: initialProfile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    let activeWorkspaceId = initialProfile?.active_workspace_id ?? null;
    let justCreated = false;

    if (!activeWorkspaceId && !hasBootstrapped.current) {
      hasBootstrapped.current = true;
      const { data: bootstrapRows } = await supabase.rpc("ensure_default_workspace");
      const bootstrapResult = Array.isArray(bootstrapRows) ? bootstrapRows[0] : bootstrapRows;
      activeWorkspaceId = (bootstrapResult?.workspace_id as string | undefined) ?? null;
      justCreated = Boolean(bootstrapResult?.is_new);
    }

    const [profileResult, workspaceResult, brandingResult, memberResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      activeWorkspaceId
        ? supabase.from("workspaces").select("*").eq("id", activeWorkspaceId).single()
        : Promise.resolve({ data: null }),
      activeWorkspaceId
        ? supabase.from("workspace_branding").select("*").eq("workspace_id", activeWorkspaceId).single()
        : Promise.resolve({ data: null }),
      activeWorkspaceId
        ? supabase.from("workspace_members").select("role").eq("workspace_id", activeWorkspaceId).eq("user_id", user.id).single()
        : Promise.resolve({ data: null }),
    ]);

    const resolvedBranding = (brandingResult.data as WorkspaceBrandingRow | null) ?? (activeWorkspaceId ? buildDefaultBranding(activeWorkspaceId) : null);

    setProfile((profileResult.data as ProfileRow | null) ?? null);
    setWorkspace((workspaceResult.data as WorkspaceRow | null) ?? null);
    setBranding(resolvedBranding);
    setRole((memberResult.data as { role: string } | null)?.role ?? null);
    setIsLoading(false);

    if (resolvedBranding) {
      applyBrandingTokens(resolvedBranding);
      cacheBrandingLocally(resolvedBranding.workspace_id, resolvedBranding);
    }

    if (justCreated) {
      router.push("/onboarding");
    }
  }, [router]);

  useEffect(() => {
    // Appel différé hors du corps synchrone de l'effet (règle react-hooks/set-state-in-effect) :
    // `load` met à jour de l'état local, mais uniquement après ses propres `await`.
    const timeout = setTimeout(() => void load(), 0);
    return () => clearTimeout(timeout);
  }, [load]);

  // Synchronisation multi-onglets : si un autre onglet enregistre une nouvelle identité
  // visuelle, on la ré-applique ici sans attendre un nouveau chargement complet.
  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== "clickpost-branding" || !workspace) return;
      const updated = readCachedBranding(workspace.id);
      if (updated) {
        setBranding(updated);
        applyBrandingTokens(updated);
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [workspace]);

  async function updateProfile(patch: Partial<ProfileRow>): Promise<UpdateResult> {
    if (!userId) return { error: "Aucun utilisateur connecté." };
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
    if (error) return { error: error.message };
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
    return { error: null };
  }

  async function updateWorkspace(patch: Partial<WorkspaceRow>): Promise<UpdateResult> {
    if (!workspace) return { error: "Aucun espace de travail actif." };
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("workspaces").update(patch).eq("id", workspace.id);
    if (error) return { error: error.message };
    setWorkspace((prev) => (prev ? { ...prev, ...patch } : prev));
    return { error: null };
  }

  async function updateBranding(patch: Partial<WorkspaceBrandingRow>): Promise<UpdateResult> {
    if (!workspace) return { error: "Aucun espace de travail actif." };
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("workspace_branding").update(patch).eq("workspace_id", workspace.id);
    if (error) return { error: error.message };
    setBranding((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      applyBrandingTokens(next);
      cacheBrandingLocally(workspace.id, next);
      return next;
    });
    return { error: null };
  }

  const value: WorkspaceSessionValue = {
    userId,
    email,
    profile,
    workspace,
    branding,
    isLoading,
    isAdmin: role === "owner" || role === "admin",
    refresh: load,
    updateProfile,
    updateWorkspace,
    updateBranding,
  };

  return <WorkspaceSessionContext.Provider value={value}>{children}</WorkspaceSessionContext.Provider>;
}

export function useWorkspaceSession() {
  const context = useContext(WorkspaceSessionContext);
  if (!context) {
    throw new Error("useWorkspaceSession must be used within a WorkspaceSessionProvider");
  }
  return context;
}
