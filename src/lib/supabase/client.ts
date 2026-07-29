"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase pour les Client Components. Chaque appel crée une instance légère
 * partageant la session via les cookies gérés par @supabase/ssr — pas de singleton
 * module-level nécessaire, le SDK réutilise déjà le stockage de session sous-jacent.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
