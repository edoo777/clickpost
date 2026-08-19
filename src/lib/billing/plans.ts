import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Plan, SubscriptionStatus, WorkspaceSubscription } from "@/types/billing";

function mapPlanRow(row: Record<string, unknown>): Plan {
  return {
    key: row.key as string,
    name: row.name as string,
    description: (row.description as string | null) ?? "",
    priceUsdCents: (row.price_usd_cents as number | null) ?? null,
    aiGenerationQuotaMonthly: (row.ai_generation_quota_monthly as number | null) ?? null,
    maxBrands: (row.max_brands as number | null) ?? null,
    maxSocialAccounts: (row.max_social_accounts as number | null) ?? null,
    maxWorkspaceMembers: (row.max_workspace_members as number | null) ?? null,
    features: (row.features as Record<string, boolean> | null) ?? {},
    isDefault: Boolean(row.is_default),
    active: Boolean(row.active),
  };
}

const FALLBACK_FREE_PLAN: Plan = {
  key: "free",
  name: "Gratuit",
  description: "",
  priceUsdCents: 0,
  aiGenerationQuotaMonthly: 20,
  maxBrands: 1,
  maxSocialAccounts: 2,
  maxWorkspaceMembers: 1,
  features: {},
  isDefault: true,
  active: true,
};

/** Lecture publique (RLS ouverte en select sur `plans`) — jamais d'écriture ici. */
export async function getPlan(key: string): Promise<Plan | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("plans").select("*").eq("key", key).maybeSingle();
  return data ? mapPlanRow(data as Record<string, unknown>) : null;
}

export async function listActivePlans(): Promise<Plan[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("plans").select("*").eq("active", true).order("sort_order", { ascending: true });
  return (data ?? []).map((row) => mapPlanRow(row as Record<string, unknown>));
}

function mapSubscriptionRow(row: Record<string, unknown>): WorkspaceSubscription {
  return {
    workspaceId: row.workspace_id as string,
    planKey: row.plan_key as string,
    status: row.status as SubscriptionStatus,
    stripeCustomerId: (row.stripe_customer_id as string | null) ?? null,
    stripeSubscriptionId: (row.stripe_subscription_id as string | null) ?? null,
    currentPeriodEnd: (row.current_period_end as string | null) ?? null,
    trialEndsAt: (row.trial_ends_at as string | null) ?? null,
    canceledAt: (row.canceled_at as string | null) ?? null,
  };
}

/**
 * Lecture avec la session normale de l'utilisateur appelant (RLS : membre du workspace). Un
 * trigger en base (`ensure_default_subscription`, voir migration
 * 20260819000000_analytics_billing_foundations.sql) garantit qu'une ligne existe toujours pour un
 * workspace réel — cette fonction ne fabrique jamais un statut "active" en repli, seulement le
 * plan gratuit avec le statut honnête "none" si la ligne est introuvable pour une raison quelconque.
 */
export async function getWorkspaceSubscription(workspaceId: string): Promise<WorkspaceSubscription> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("workspace_subscriptions").select("*").eq("workspace_id", workspaceId).maybeSingle();
  if (data) return mapSubscriptionRow(data as Record<string, unknown>);
  return { workspaceId, planKey: "free", status: "none", stripeCustomerId: null, stripeSubscriptionId: null, currentPeriodEnd: null, trialEndsAt: null, canceledAt: null };
}

export interface WorkspacePlanContext {
  plan: Plan;
  subscription: WorkspaceSubscription;
}

/** Combine l'abonnement et la définition de plan associée — repli sûr sur le plan gratuit codé en
 * dur si la table `plans` est temporairement inaccessible (jamais un plan illimité par défaut). */
export async function getWorkspacePlanContext(workspaceId: string): Promise<WorkspacePlanContext> {
  const subscription = await getWorkspaceSubscription(workspaceId);
  const plan = (await getPlan(subscription.planKey)) ?? FALLBACK_FREE_PLAN;
  return { plan, subscription };
}
