import { NextResponse } from "next/server";
import { PROMPT_OVERRIDE_KEYS, restorePreviousPromptOverride, savePromptOverride, type PromptOverrideKey } from "@/lib/admin/prompt-overrides";
import { requirePlatformAdmin } from "@/lib/admin/require-admin";

const MAX_LENGTH = 4000;

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ status: "error", code, message }, { status });
}

/** Écriture réservée à l'administrateur ClickPost — revérifié ici indépendamment du middleware
 * (défense en profondeur, voir src/proxy.ts). Écrit via service_role car prompt_overrides n'a
 * aucune politique RLS d'écriture pour un utilisateur authentifié normal. */
export async function POST(request: Request) {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) return errorResponse("forbidden", "Accès réservé à l'administrateur ClickPost.", 403);

  const rawBody = await request.json().catch(() => null);
  const record = rawBody as Record<string, unknown> | null;
  const key = record?.key;
  if (typeof key !== "string" || !PROMPT_OVERRIDE_KEYS.includes(key as PromptOverrideKey)) {
    return errorResponse("invalid_request", "Clé de prompt invalide.", 400);
  }

  if (record?.action === "restore") {
    await restorePreviousPromptOverride(key as PromptOverrideKey, admin.userId);
    return NextResponse.json({ status: "ok" });
  }

  const extraInstructions = record?.extraInstructions;
  if (typeof extraInstructions !== "string" || extraInstructions.length > MAX_LENGTH) {
    return errorResponse("invalid_request", `Texte d'instructions invalide (maximum ${MAX_LENGTH} caractères).`, 400);
  }

  await savePromptOverride(key as PromptOverrideKey, extraInstructions.trim(), admin.userId);
  return NextResponse.json({ status: "ok" });
}
