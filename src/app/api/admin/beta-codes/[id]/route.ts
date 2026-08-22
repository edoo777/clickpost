import { NextResponse } from "next/server";
import { setBetaCodeActive } from "@/lib/billing/beta-codes";
import { requirePlatformAdmin } from "@/lib/admin/require-admin";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ status: "error", code, message }, { status });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) return errorResponse("forbidden", "Accès réservé à l'administrateur ClickPost.", 403);

  const { id } = await context.params;
  const rawBody = await request.json().catch(() => null);
  const active = (rawBody as { active?: unknown } | null)?.active;
  if (typeof active !== "boolean") return errorResponse("invalid_request", "Requête invalide.", 400);

  await setBetaCodeActive(id, active);
  return NextResponse.json({ status: "ok" });
}
