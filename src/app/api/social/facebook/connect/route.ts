import { NextResponse } from "next/server";
import { isMetaOAuthConfigured, FACEBOOK_SCOPES } from "@/lib/meta/config";
import { buildAuthorizationUrl } from "@/lib/meta/oauth";
import { isWorkspaceAdmin } from "@/lib/social/workspace-guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Étape 1/2 du flux OAuth Facebook — voir src/app/api/social/linkedin/connect/route.ts pour
 * l'implémentation de référence dont celle-ci s'inspire directement. */
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/connexion", request.url));

  if (!isMetaOAuthConfigured("facebook")) {
    return NextResponse.redirect(new URL("/comptes?facebook_error=not_configured", request.url));
  }

  const { searchParams } = new URL(request.url);
  const brandId = searchParams.get("brandId");
  if (!brandId) {
    return NextResponse.redirect(new URL("/comptes?facebook_error=missing_brand", request.url));
  }

  const { data: brand, error: brandError } = await supabase.from("brands").select("id, workspace_id").eq("id", brandId).single();
  if (brandError || !brand) {
    return NextResponse.redirect(new URL("/comptes?facebook_error=brand_not_found", request.url));
  }

  const workspaceId = (brand as { workspace_id: string }).workspace_id;
  const admin = await isWorkspaceAdmin(supabase, workspaceId, user.id);
  if (!admin) {
    return NextResponse.redirect(new URL("/comptes?facebook_error=forbidden", request.url));
  }

  const authorizationUrl = buildAuthorizationUrl("facebook", { workspaceId, brandId, userId: user.id, platform: "facebook" }, FACEBOOK_SCOPES);
  return NextResponse.redirect(authorizationUrl);
}
