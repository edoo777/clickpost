import { NextResponse } from "next/server";
import { isYouTubeOAuthConfigured } from "@/lib/youtube/config";
import { buildAuthorizationUrl } from "@/lib/youtube/oauth";
import { isWorkspaceAdmin } from "@/lib/social/workspace-guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/connexion", request.url));

  if (!isYouTubeOAuthConfigured()) {
    return NextResponse.redirect(new URL("/comptes?youtube_error=not_configured", request.url));
  }

  const { searchParams } = new URL(request.url);
  const brandId = searchParams.get("brandId");
  if (!brandId) {
    return NextResponse.redirect(new URL("/comptes?youtube_error=missing_brand", request.url));
  }

  const { data: brand, error: brandError } = await supabase.from("brands").select("id, workspace_id").eq("id", brandId).single();
  if (brandError || !brand) {
    return NextResponse.redirect(new URL("/comptes?youtube_error=brand_not_found", request.url));
  }

  const workspaceId = (brand as { workspace_id: string }).workspace_id;
  const admin = await isWorkspaceAdmin(supabase, workspaceId, user.id);
  if (!admin) {
    return NextResponse.redirect(new URL("/comptes?youtube_error=forbidden", request.url));
  }

  const authorizationUrl = buildAuthorizationUrl({ workspaceId, brandId, userId: user.id, platform: "youtube" });
  return NextResponse.redirect(authorizationUrl);
}
