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
  // Site public (marketing) — voir src/app/solution, src/app/prix, src/app/ressources,
  // src/app/contact. Accessibles à tous, connectés ou non (contrairement à /connexion,
  // /inscription, /bienvenue ci-dessous, qui redirigent un utilisateur déjà connecté).
  "/solution",
  "/prix",
  "/ressources",
  "/contact",
  "/cookies",
  // Fichiers techniques générés par Next.js (voir src/app/robots.ts, src/app/sitemap.ts) — un
  // moteur de recherche ne présente jamais de session, jamais exclus par le matcher ci-dessous
  // (seuls _next/static, _next/image, favicon.ico et les images le sont).
  "/robots.txt",
  "/sitemap.xml",
];
// Préfixes publics — pour des routes avec segments dynamiques (`/blog/[slug]`) ou des routes API
// destinées à un visiteur non authentifié (ex. le formulaire de contact public), où une
// correspondance exacte de `PUBLIC_PATHS` ne suffit pas.
const PUBLIC_PATH_PREFIXES = ["/blog", "/api/marketing/"];
// Un utilisateur déjà connecté ne doit pas rester sur ces pages précises.
const REDIRECT_IF_AUTHENTICATED_PATHS = ["/connexion", "/inscription", "/bienvenue"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname) || PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

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
    if (!user && !isPublicPath(pathname)) {
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
