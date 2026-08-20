import { NextResponse } from "next/server";
import { computeSocialConnectionState } from "@/lib/social/connection-state";
import { isMetaOAuthConfigured, FACEBOOK_SCOPES } from "@/lib/meta/config";
import { mapRowToRecord } from "@/lib/sync/mappers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SocialAccount } from "@/types/dashboard";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ status: "error", code, message }, { status });
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorResponse("unauthorized", "Authentification requise.", 401);

  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");

  const configured = isMetaOAuthConfigured("facebook");

  if (!accountId) {
    return NextResponse.json({ status: "ok", summary: computeSocialConnectionState(undefined, configured, FACEBOOK_SCOPES) });
  }

  const { data: accountRow, error } = await supabase.from("accounts").select("*").eq("id", accountId).maybeSingle();
  if (error) return errorResponse("unauthorized", "Compte introuvable ou inaccessible.", 404);

  const account = accountRow ? (mapRowToRecord(accountRow) as unknown as SocialAccount) : undefined;
  return NextResponse.json({ status: "ok", summary: computeSocialConnectionState(account, configured, FACEBOOK_SCOPES) });
}
