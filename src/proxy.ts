import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Accessibles sans session valide. Tout le reste (le groupe dashboard, en pratique) est protégé.
const PUBLIC_PATHS = ["/connexion", "/inscription", "/mot-de-passe-oublie", "/reinitialiser-mot-de-passe"];
// Un utilisateur déjà connecté ne doit pas rester sur ces deux pages précises.
const REDIRECT_IF_AUTHENTICATED_PATHS = ["/connexion", "/inscription"];

/**
 * Rafraîchissement de session Supabase (F1.1) + protection des routes (F1.2) pour l'App Router.
 * Retirer l'appel à `getUser()` casserait le rafraîchissement des sessions expirées côté
 * serveur — ne pas le supprimer même si la logique de redirection change.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthCallback = pathname.startsWith("/auth/callback");

  if (!isAuthCallback) {
    if (!user && !PUBLIC_PATHS.includes(pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/connexion";
      return NextResponse.redirect(redirectUrl);
    }

    if (user && REDIRECT_IF_AUTHENTICATED_PATHS.includes(pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
