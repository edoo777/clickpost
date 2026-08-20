import { NextResponse } from "next/server";
import { processMetaCallback } from "@/lib/meta/callback";
import { cacheCallbackOutcome, getCachedCallbackOutcome } from "@/lib/social/callback-idempotency";

/** Étape 2/2 du flux OAuth Facebook — voir src/lib/meta/callback.ts pour la logique partagée
 * avec Instagram. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const errorParam = searchParams.get("error");
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (errorParam) {
    return NextResponse.redirect(new URL("/comptes?facebook_error=consent_denied", request.url));
  }
  if (!code || !state) {
    return NextResponse.redirect(new URL("/comptes?facebook_error=missing_params", request.url));
  }

  const cached = getCachedCallbackOutcome("facebook", code);
  if (cached) return NextResponse.redirect(new URL(cached, request.url));

  const resultPath = await processMetaCallback("facebook", code, state);
  cacheCallbackOutcome("facebook", code, resultPath);
  return NextResponse.redirect(new URL(resultPath, request.url));
}
