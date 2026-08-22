import { NextResponse } from "next/server";
import { listActiveBetaGrants } from "@/lib/billing/beta-codes";
import { requirePlatformAdmin } from "@/lib/admin/require-admin";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ status: "error", code, message }, { status });
}

export async function GET() {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) return errorResponse("forbidden", "Accès réservé à l'administrateur ClickPost.", 403);

  const grants = await listActiveBetaGrants();
  return NextResponse.json({ status: "ok", grants });
}
