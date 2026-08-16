import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isPlatformAdminEmail } from "@/lib/admin/is-platform-admin";

// Accessibles sans session valide. Tout le reste (le groupe dashboard, en pratique) est protégé.
const PUBLIC_PATHS = [
  "/connexion",
  "/inscription",
  "/mot-de-passe-oublie",
  "/reinitialiser-mot-de-passe",
  "/bienvenue",
  "/conditions",
  "/confidentialite",
];
// Un utilisateur déjà connecté ne doit pas rester sur ces pages précises.
const REDIRECT_IF_AUTHENTICATED_PATHS = ["/connexion", "/inscription", "/bienvenue"];

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
  // Les routes de tâches planifiées (ex. déclencheur LinkedIn, voir vercel.json) s'authentifient
  // elles-mêmes via CRON_SECRET, jamais une session utilisateur — un appel de Vercel Cron n'a
  // aucun cookie de session et serait sinon systématiquement redirigé vers /connexion avant même
  // d'atteindre le handler de la route, empêchant toute exécution planifiée.
  const isCronRoute = pathname.startsWith("/api/cron/");

  if (!isAuthCallback && !isCronRoute) {
    if (!user && !PUBLIC_PATHS.includes(pathname)) {
      const redirectUrl = request.nextUrl.clone();
      // La racine "/" est le tableau de bord authentifié — un visiteur non connecté y voit
      // d'abord la landing page publique, jamais directement le formulaire de connexion.
      redirectUrl.pathname = pathname === "/" ? "/bienvenue" : "/connexion";
      return NextResponse.redirect(redirectUrl);
    }

    if (user && REDIRECT_IF_AUTHENTICATED_PATHS.includes(pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/";
      return NextResponse.redirect(redirectUrl);
    }

    // Espace Admin ClickPost — jamais un rôle de workspace, une liste d'e-mails serveur
    // uniquement (voir is-platform-admin.ts). Première ligne de défense seulement : le layout
    // /admin revérifie indépendamment côté serveur (défense en profondeur).
    if (pathname.startsWith("/admin") && !isPlatformAdminEmail(user?.email)) {
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
