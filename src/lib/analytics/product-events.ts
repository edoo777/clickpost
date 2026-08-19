import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Funnel produit complet (voir docs/FINAL-BETA-READINESS.md) — chaque nom correspond à un moment
 * réel du parcours utilisateur, jamais un événement synthétique. Sert de source unique au tableau
 * de bord Admin (DAU/WAU/MAU, funnel visiteurs→retenus dans la mesure du possible, usage par
 * fonctionnalité).
 */
export const PRODUCT_EVENT_NAMES = [
  "signup",
  "onboarding_started",
  "onboarding_completed",
  "workspace_created",
  "brand_created",
  "social_connected",
  "idea_created",
  "ai_generation",
  "content_created",
  "content_approved",
  "content_scheduled",
  "content_published",
  "report_generated",
  "subscription_started",
  "subscription_cancelled",
] as const;

export type ProductEventName = (typeof PRODUCT_EVENT_NAMES)[number];

export interface RecordProductEventInput {
  eventName: ProductEventName;
  userId: string;
  workspaceId?: string | null;
  /** Métadonnées non sensibles uniquement (ex. plateforme, format) — jamais de contenu utilisateur
   * ni de donnée personnelle au-delà de ce qui est déjà nécessaire à l'agrégation. */
  metadata?: Record<string, string | number | boolean>;
}

/**
 * Journalise un événement produit réel — jamais fabriqué, jamais rétroactif. Ne bloque et ne fait
 * jamais échouer l'action appelante : l'analytics ne doit jamais dégrader une fonctionnalité
 * réelle. À appeler depuis du code serveur (route handler, server action) avec le client Supabase
 * de la session de l'utilisateur concerné (RLS : `user_id = auth.uid()`).
 */
export async function recordProductEvent(supabase: SupabaseClient, input: RecordProductEventInput): Promise<void> {
  try {
    await supabase.from("product_events").insert({
      event_name: input.eventName,
      user_id: input.userId,
      workspace_id: input.workspaceId ?? null,
      metadata: input.metadata ?? {},
    });
  } catch (error) {
    console.warn("[analytics/product-events] échec d'enregistrement (non bloquant)", error);
  }
}
