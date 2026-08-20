import { NextResponse } from "next/server";
import { isMetaOAuthConfigured } from "@/lib/meta/config";
import { INSTAGRAM_SCOPES } from "@/lib/meta/config";
import { buildAuthorizationUrl } from "@/lib/meta/oauth";
import { isWorkspaceAdmin } from "@/lib/social/workspace-guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Étape 1/2 du flux OAuth Instagram — voir src/lib/linkedin/oauth.ts et
 * src/app/api/social/linkedin/connect/route.ts pour l'implémentation de référence dont celle-ci
 * s'inspire directement. Jamais de secret transmis au navigateur. */
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/connexion", request.url));

  if (!isMetaOAuthConfigured("instagram")) {
    return NextResponse.redirect(new URL("/comptes?instagram_error=not_configured", request.url));
  }

  const { searchParams } = new URL(request.url);
  const brandId = searchParams.get("brandId");
  if (!brandId) {
    return NextResponse.redirect(new URL("/comptes?instagram_error=missing_brand", request.url));
  }

  const { data: brand, error: brandError } = await supabase.from("brands").select("id, workspace_id").eq("id", brandId).single();
  if (brandError || !brand) {
    return NextResponse.redirect(new URL("/comptes?instagram_error=brand_not_found", request.url));
  }

  const workspaceId = (brand as { workspace_id: string }).workspace_id;
  const admin = await isWorkspaceAdmin(supabase, workspaceId, user.id);
  if (!admin) {
    return NextResponse.redirect(new URL("/comptes?instagram_error=forbidden", request.url));
  }

  const authorizationUrl = buildAuthorizationUrl("instagram", { workspaceId, brandId, userId: user.id, platform: "instagram" }, INSTAGRAM_SCOPES);
  return NextResponse.redirect(authorizationUrl);
}
