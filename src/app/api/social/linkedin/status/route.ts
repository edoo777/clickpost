import { NextResponse } from "next/server";
import { computeLinkedInConnectionState } from "@/lib/linkedin/connection-state";
import { isLinkedInOAuthConfigured } from "@/lib/linkedin/config";
import { mapRowToRecord } from "@/lib/sync/mappers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SocialAccount } from "@/types/dashboard";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ status: "error", code, message }, { status });
}

/**
 * Seule route qui a le droit de vérifier `isLinkedInOAuthConfigured()` pour l'affichage — cette
 * vérification dépend de variables d'environnement serveur (jamais `NEXT_PUBLIC_`), donc jamais
 * disponible directement côté client. Ne renvoie jamais de jeton, uniquement l'état calculé.
 */
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorResponse("unauthorized", "Authentification requise.", 401);

  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");

  const configured = isLinkedInOAuthConfigured();

  if (!accountId) {
    return NextResponse.json({ status: "ok", summary: computeLinkedInConnectionState(undefined, configured) });
  }

  const { data: accountRow, error } = await supabase.from("accounts").select("*").eq("id", accountId).maybeSingle();
  if (error) return errorResponse("unauthorized", "Compte introuvable ou inaccessible.", 404);

  const account = accountRow ? (mapRowToRecord(accountRow) as unknown as SocialAccount) : undefined;
  return NextResponse.json({ status: "ok", summary: computeLinkedInConnectionState(account, configured) });
}
