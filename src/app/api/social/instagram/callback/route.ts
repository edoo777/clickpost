import { NextResponse } from "next/server";
import { processMetaCallback } from "@/lib/meta/callback";
import { cacheCallbackOutcome, getCachedCallbackOutcome } from "@/lib/social/callback-idempotency";

/** Étape 2/2 du flux OAuth Instagram — voir src/lib/meta/callback.ts pour la logique partagée
 * avec Facebook, et src/app/api/social/linkedin/callback/route.ts pour l'implémentation de
 * référence dont celle-ci s'inspire directement (même garde-fous : state revérifié, session et
 * rôle admin revérifiés, idempotence par code déjà traité). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const errorParam = searchParams.get("error");
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (errorParam) {
    return NextResponse.redirect(new URL("/comptes?instagram_error=consent_denied", request.url));
  }
  if (!code || !state) {
    return NextResponse.redirect(new URL("/comptes?instagram_error=missing_params", request.url));
  }

  const cached = getCachedCallbackOutcome("instagram", code);
  if (cached) return NextResponse.redirect(new URL(cached, request.url));

  const resultPath = await processMetaCallback("instagram", code, state);
  cacheCallbackOutcome("instagram", code, resultPath);
  return NextResponse.redirect(new URL(resultPath, request.url));
}
