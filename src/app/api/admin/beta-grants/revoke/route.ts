import { NextResponse } from "next/server";
import { revokeBetaGrant } from "@/lib/billing/beta-codes";
import { requirePlatformAdmin } from "@/lib/admin/require-admin";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ status: "error", code, message }, { status });
}

export async function POST(request: Request) {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) return errorResponse("forbidden", "Accès réservé à l'administrateur ClickPost.", 403);

  const rawBody = await request.json().catch(() => null);
  const workspaceId = (rawBody as { workspaceId?: unknown } | null)?.workspaceId;
  if (typeof workspaceId !== "string" || workspaceId.length === 0) {
    return errorResponse("invalid_request", "Requête invalide.", 400);
  }

  await revokeBetaGrant(workspaceId);
  return NextResponse.json({ status: "ok" });
}
