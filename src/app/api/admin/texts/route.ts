import { NextResponse } from "next/server";
import { PRODUCT_TEXT_KEYS, restorePreviousProductText, saveProductText, type ProductTextKey } from "@/lib/admin/product-texts";
import { requirePlatformAdmin } from "@/lib/admin/require-admin";

const MAX_LENGTH = 2000;

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ status: "error", code, message }, { status });
}

export async function POST(request: Request) {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) return errorResponse("forbidden", "Accès réservé à l'administrateur ClickPost.", 403);

  const rawBody = await request.json().catch(() => null);
  const record = rawBody as Record<string, unknown> | null;
  const key = record?.key;
  if (typeof key !== "string" || !PRODUCT_TEXT_KEYS.includes(key as ProductTextKey)) {
    return errorResponse("invalid_request", "Clé de texte invalide.", 400);
  }

  if (record?.action === "restore") {
    await restorePreviousProductText(key as ProductTextKey, admin.userId);
    return NextResponse.json({ status: "ok" });
  }

  const value = record?.value;
  if (typeof value !== "string" || value.trim().length === 0 || value.length > MAX_LENGTH) {
    return errorResponse("invalid_request", `Texte invalide (1 à ${MAX_LENGTH} caractères).`, 400);
  }

  await saveProductText(key as ProductTextKey, value.trim(), admin.userId);
  return NextResponse.json({ status: "ok" });
}
