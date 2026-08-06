import { NextResponse } from "next/server";
import {
  isLinkedInOAuthConfigured,
  isLinkedInOrganizationAccessEnabled,
  LINKEDIN_MEMBER_SCOPES,
  LINKEDIN_ORGANIZATION_SCOPES,
} from "@/lib/linkedin/config";
import { buildAuthorizationUrl } from "@/lib/linkedin/oauth";
import { isWorkspaceAdmin } from "@/lib/linkedin/workspace-guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Étape 1/2 du flux OAuth LinkedIn : construit l'URL d'autorisation et redirige. Jamais de clé
 * secrète transmise au navigateur — le `client_secret` ne sert qu'à signer le `state` et à
 * l'échange du code, tous deux effectués côté serveur (voir state-token.ts, oauth.ts).
 */
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/connexion", request.url));

  if (!isLinkedInOAuthConfigured()) {
    return NextResponse.redirect(new URL("/comptes?linkedin_error=not_configured", request.url));
  }

  const { searchParams } = new URL(request.url);
  const brandId = searchParams.get("brandId");
  if (!brandId) {
    return NextResponse.redirect(new URL("/comptes?linkedin_error=missing_brand", request.url));
  }

  const { data: brand, error: brandError } = await supabase.from("brands").select("id, workspace_id").eq("id", brandId).single();
  if (brandError || !brand) {
    return NextResponse.redirect(new URL("/comptes?linkedin_error=brand_not_found", request.url));
  }

  const workspaceId = (brand as { workspace_id: string }).workspace_id;
  const admin = await isWorkspaceAdmin(supabase, workspaceId, user.id);
  if (!admin) {
    return NextResponse.redirect(new URL("/comptes?linkedin_error=forbidden", request.url));
  }

  // Portées Page Entreprise (Phase 4) demandées uniquement sur demande explicite ET si l'accès
  // organisation est réellement activé côté serveur — jamais réclamées par défaut.
  const includeOrganization = searchParams.get("includeOrganization") === "true" && isLinkedInOrganizationAccessEnabled();
  const scopes = includeOrganization ? [...LINKEDIN_MEMBER_SCOPES, ...LINKEDIN_ORGANIZATION_SCOPES] : LINKEDIN_MEMBER_SCOPES;

  const authorizationUrl = buildAuthorizationUrl({ workspaceId, brandId, userId: user.id, platform: "linkedin" }, scopes);
  return NextResponse.redirect(authorizationUrl);
}
