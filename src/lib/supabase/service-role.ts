import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase avec la clé `service_role` — contourne la RLS par conception. **Ne jamais**
 * appeler cette factory depuis un composant "use client", une route publique, ou tout code
 * atteignable par le navigateur. Pas de dépendance "server-only" ajoutée pour cette seule
 * protection (installation de paquet toujours soumise à confirmation explicite, voir CLAUDE.md) :
 * la vérification `typeof window` ci-dessous, combinée à une utilisation strictement confinée
 * aux route handlers serveur (src/app/api/social/**, jamais un composant "use client"), suffit
 * ici — même principe déjà appliqué par `createSupabaseServerClient` (server.ts), qui n'a pas
 * cette dépendance non plus et s'appuie sur `next/headers`.
 *
 * Usage strictement réservé aux tables dont la RLS n'accorde AUCUNE politique d'écriture cliente
 * par conception : `social_connections` (jetons OAuth chiffrés, routes serveur OAuth/publication
 * uniquement) et les tables de configuration plateforme de l'espace Admin —
 * `prompt_overrides`/`product_texts`/`feature_flags` (écriture réservée aux routes
 * `src/app/api/admin/**`, elles-mêmes gardées par `isPlatformAdminEmail()` avant tout appel à ce
 * client). Ne jamais l'utiliser pour une autre table — toutes les autres données du workspace
 * restent gouvernées par la RLS via le client serveur habituel (`createSupabaseServerClient`, qui
 * respecte la session de l'utilisateur réel).
 */
export function createSupabaseServiceRoleClient() {
  if (typeof window !== "undefined") {
    throw new Error("createSupabaseServiceRoleClient() ne doit jamais être appelé côté navigateur.");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY absente — la connexion aux comptes sociaux réels est indisponible.");
  }
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function isServiceRoleConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
