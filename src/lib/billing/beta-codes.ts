import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { BetaCode } from "@/types/billing";

function mapBetaCodeRow(row: Record<string, unknown>): BetaCode {
  return {
    id: row.id as string,
    code: row.code as string,
    planKey: row.plan_key as string,
    grantDurationDays: row.grant_duration_days as number,
    maxUses: (row.max_uses as number | null) ?? null,
    usedCount: row.used_count as number,
    active: Boolean(row.active),
    createdAt: row.created_at as string,
    createdBy: (row.created_by as string | null) ?? null,
  };
}

export type RedeemBetaCodeResult =
  | { ok: true; planKey: string; expiresAt: string }
  | { ok: false; code: "not_admin" | "invalid_code" | "code_inactive" | "code_exhausted" | "storage_error" };

/**
 * Vérifie et applique un code bêta pour un workspace — jamais le rôle du client dans la
 * vérification du code lui-même : `code`/`beta_codes` ne sont jamais lisibles par
 * `authenticated`/`anon` (voir la migration 20260822000000_beta_access_codes.sql), toute la
 * validation se fait ici, côté serveur, avec le client service_role. N'écrit jamais dans
 * `plan_key`/`status` de `workspace_subscriptions` — uniquement la superposition
 * `beta_plan_key`/`beta_expires_at`/`beta_code_id` (voir getWorkspacePlanContext).
 */
export async function redeemBetaCode(workspaceId: string, rawCode: string): Promise<RedeemBetaCodeResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, code: "invalid_code" };

  const supabase = createSupabaseServiceRoleClient();
  const { data: codeRow } = await supabase.from("beta_codes").select("*").eq("code", code).maybeSingle();
  if (!codeRow) return { ok: false, code: "invalid_code" };

  const betaCode = mapBetaCodeRow(codeRow as Record<string, unknown>);
  if (!betaCode.active) return { ok: false, code: "code_inactive" };
  if (betaCode.maxUses !== null && betaCode.usedCount >= betaCode.maxUses) return { ok: false, code: "code_exhausted" };

  const expiresAt = new Date(Date.now() + betaCode.grantDurationDays * 24 * 60 * 60 * 1000).toISOString();

  const { error: updateError } = await supabase
    .from("workspace_subscriptions")
    .update({ beta_plan_key: betaCode.planKey, beta_expires_at: expiresAt, beta_code_id: betaCode.id })
    .eq("workspace_id", workspaceId);
  if (updateError) return { ok: false, code: "storage_error" };

  await supabase
    .from("beta_codes")
    .update({ used_count: betaCode.usedCount + 1 })
    .eq("id", betaCode.id);

  return { ok: true, planKey: betaCode.planKey, expiresAt };
}

/** Révoque un accès bêta en cours (Admin ClickPost) — ne touche jamais `plan_key`/`status`. */
export async function revokeBetaGrant(workspaceId: string): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();
  await supabase
    .from("workspace_subscriptions")
    .update({ beta_plan_key: null, beta_expires_at: null, beta_code_id: null })
    .eq("workspace_id", workspaceId);
}

export async function listBetaCodes(): Promise<BetaCode[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase.from("beta_codes").select("*").order("created_at", { ascending: false });
  return (data ?? []).map((row) => mapBetaCodeRow(row as Record<string, unknown>));
}

export async function createBetaCode(params: {
  code: string;
  planKey: string;
  grantDurationDays: number;
  maxUses: number | null;
  createdBy: string;
}): Promise<BetaCode | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("beta_codes")
    .insert({
      code: params.code.trim().toUpperCase(),
      plan_key: params.planKey,
      grant_duration_days: params.grantDurationDays,
      max_uses: params.maxUses,
      created_by: params.createdBy,
    })
    .select("*")
    .single();
  if (error || !data) return null;
  return mapBetaCodeRow(data as Record<string, unknown>);
}

export async function setBetaCodeActive(id: string, active: boolean): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();
  await supabase.from("beta_codes").update({ active }).eq("id", id);
}

export interface ActiveBetaGrant {
  workspaceId: string;
  workspaceName: string;
  betaPlanKey: string;
  betaExpiresAt: string;
}

/** Liste tous les workspaces ayant un accès bêta actuellement défini (même expiré — l'admin doit
 * pouvoir voir et nettoyer les accès passés, la résolution "expiré = ignoré" ne s'applique qu'à
 * getWorkspacePlanContext, pas à cette vue d'administration). */
export async function listActiveBetaGrants(): Promise<ActiveBetaGrant[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from("workspace_subscriptions")
    .select("workspace_id, beta_plan_key, beta_expires_at, workspaces(name)")
    .not("beta_plan_key", "is", null)
    .order("beta_expires_at", { ascending: false });

  return (data ?? []).map((row) => {
    const record = row as Record<string, unknown>;
    const workspace = record.workspaces as { name?: string } | { name?: string }[] | null;
    const workspaceName = Array.isArray(workspace) ? (workspace[0]?.name ?? "—") : (workspace?.name ?? "—");
    return {
      workspaceId: record.workspace_id as string,
      workspaceName,
      betaPlanKey: record.beta_plan_key as string,
      betaExpiresAt: record.beta_expires_at as string,
    };
  });
}
