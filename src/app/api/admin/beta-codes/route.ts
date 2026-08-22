import { NextResponse } from "next/server";
import { createBetaCode, listBetaCodes } from "@/lib/billing/beta-codes";
import { requirePlatformAdmin } from "@/lib/admin/require-admin";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ status: "error", code, message }, { status });
}

export async function GET() {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) return errorResponse("forbidden", "Accès réservé à l'administrateur ClickPost.", 403);

  const codes = await listBetaCodes();
  return NextResponse.json({ status: "ok", codes });
}

export async function POST(request: Request) {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) return errorResponse("forbidden", "Accès réservé à l'administrateur ClickPost.", 403);

  const rawBody = await request.json().catch(() => null);
  const record = rawBody as Record<string, unknown> | null;
  const code = record?.code;
  const planKey = record?.planKey;
  const grantDurationDays = record?.grantDurationDays;
  const maxUses = record?.maxUses;
  if (
    typeof code !== "string" ||
    code.trim().length === 0 ||
    typeof planKey !== "string" ||
    planKey.length === 0 ||
    typeof grantDurationDays !== "number" ||
    grantDurationDays <= 0 ||
    (maxUses !== null && maxUses !== undefined && typeof maxUses !== "number")
  ) {
    return errorResponse("invalid_request", "Requête invalide.", 400);
  }

  const created = await createBetaCode({
    code,
    planKey,
    grantDurationDays,
    maxUses: typeof maxUses === "number" ? maxUses : null,
    createdBy: admin.userId,
  });
  if (!created) return errorResponse("storage_error", "Impossible de créer le code (peut-être déjà existant).", 500);

  return NextResponse.json({ status: "ok", code: created });
}
