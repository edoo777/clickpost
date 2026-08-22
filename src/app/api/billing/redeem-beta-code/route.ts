import { NextResponse } from "next/server";
import { redeemBetaCode } from "@/lib/billing/beta-codes";
import { isWorkspaceAdmin } from "@/lib/social/workspace-guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ status: "error", code, message }, { status });
}

const REDEEM_ERROR_MESSAGES: Record<string, string> = {
  invalid_code: "Ce code bêta est introuvable.",
  code_inactive: "Ce code bêta n'est plus actif.",
  code_exhausted: "Ce code bêta a atteint son nombre maximal d'utilisations.",
  storage_error: "Impossible d'appliquer le code bêta pour le moment.",
};

/** Redemption d'un code bêta (voir src/lib/billing/beta-codes.ts) — jamais une écriture sur
 * `plan_key`/`status`, uniquement la superposition temporaire beta_*. */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorResponse("unauthorized", "Authentification requise.", 401);

  const rawBody = await request.json().catch(() => null);
  const record = rawBody as Record<string, unknown> | null;
  const workspaceId = record?.workspaceId;
  const code = record?.code;
  if (typeof workspaceId !== "string" || workspaceId.length === 0 || typeof code !== "string" || code.length === 0) {
    return errorResponse("invalid_request", "Requête invalide.", 400);
  }

  const admin = await isWorkspaceAdmin(supabase, workspaceId, user.id);
  if (!admin) return errorResponse("forbidden", "Seuls les administrateurs du workspace peuvent activer un code bêta.", 403);

  const result = await redeemBetaCode(workspaceId, code);
  if (!result.ok) {
    return errorResponse(result.code, REDEEM_ERROR_MESSAGES[result.code] ?? "Code bêta invalide.", 400);
  }

  return NextResponse.json({ status: "ok", planKey: result.planKey, expiresAt: result.expiresAt });
}
