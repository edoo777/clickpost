import { NextResponse } from "next/server";
import { setFeatureFlag } from "@/lib/admin/feature-flags";
import { requirePlatformAdmin } from "@/lib/admin/require-admin";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ status: "error", code, message }, { status });
}

export async function POST(request: Request) {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) return errorResponse("forbidden", "Accès réservé à l'administrateur ClickPost.", 403);

  const rawBody = await request.json().catch(() => null);
  const record = rawBody as Record<string, unknown> | null;
  const key = record?.key;
  const enabled = record?.enabled;
  if (typeof key !== "string" || key.length === 0 || typeof enabled !== "boolean") {
    return errorResponse("invalid_request", "Requête invalide.", 400);
  }

  await setFeatureFlag(key, enabled, admin.userId);
  return NextResponse.json({ status: "ok" });
}
