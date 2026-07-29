import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Échange le code Supabase (confirmation d'inscription ou réinitialisation de mot de passe,
 * même mécanisme PKCE) contre une session. `next` contrôle la redirection finale — utilisé par
 * /mot-de-passe-oublie pour renvoyer vers /reinitialiser-mot-de-passe.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/connexion?erreur=lien_invalide`);
}
