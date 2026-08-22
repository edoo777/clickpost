import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActiveBetaAccess, Plan, SubscriptionStatus, WorkspaceSubscription } from "@/types/billing";

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
    betaPlanKey: (row.beta_plan_key as string | null) ?? null,
    betaExpiresAt: (row.beta_expires_at as string | null) ?? null,
    betaCodeId: (row.beta_code_id as string | null) ?? null,
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
  return {
    workspaceId,
    planKey: "free",
    status: "none",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    currentPeriodEnd: null,
    trialEndsAt: null,
    canceledAt: null,
    betaPlanKey: null,
    betaExpiresAt: null,
    betaCodeId: null,
  };
}

export interface WorkspacePlanContext {
  plan: Plan;
  subscription: WorkspaceSubscription;
  /** Accès bêta actif au moment de la lecture, ou `null` si aucun (jamais expiré/inexistant). Voir
   * src/lib/billing/beta-codes.ts pour la redemption d'un code. */
  betaAccess: ActiveBetaAccess | null;
}

/** Combine l'abonnement et la définition de plan associée — repli sûr sur le plan gratuit codé en
 * dur si la table `plans` est temporairement inaccessible (jamais un plan illimité par défaut).
 * Si un accès bêta est actif (`betaExpiresAt` dans le futur), le plan bêta prévaut sur `planKey`
 * pour cette lecture uniquement — `subscription.planKey`/`status` restent la source de vérité
 * Stripe, jamais modifiés par cette résolution. */
export async function getWorkspacePlanContext(workspaceId: string): Promise<WorkspacePlanContext> {
  const subscription = await getWorkspaceSubscription(workspaceId);

  const betaActive =
    subscription.betaPlanKey && subscription.betaExpiresAt && new Date(subscription.betaExpiresAt).getTime() > Date.now();
  const betaAccess: ActiveBetaAccess | null = betaActive
    ? { planKey: subscription.betaPlanKey as string, expiresAt: subscription.betaExpiresAt as string }
    : null;

  const effectivePlanKey = betaAccess?.planKey ?? subscription.planKey;
  const plan = (await getPlan(effectivePlanKey)) ?? FALLBACK_FREE_PLAN;
  return { plan, subscription, betaAccess };
}
