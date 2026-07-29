import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase pour Server Components, Server Actions et Route Handlers.
 * Doit être recréé à chaque requête (jamais mis en cache/singleton) car il porte les
 * cookies de la requête courante.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Appelé depuis un Server Component (lecture seule) plutôt qu'une Server Action
          // ou un Route Handler : sans conséquence tant que le middleware rafraîchit la session.
        }
      },
    },
  });
}
