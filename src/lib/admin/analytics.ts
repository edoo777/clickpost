import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

/** Réservé aux pages /admin/**, déjà gardées par isPlatformAdminEmail() (voir admin/layout.tsx). */

export type PeriodPreset = "7" | "30" | "90" | "365";

export function periodStartIso(period: PeriodPreset): string {
  const days = Number(period);
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - days);
  return start.toISOString();
}

export interface FunnelCounts {
  signup: number;
  onboardingStarted: number;
  onboardingCompleted: number;
  workspaceCreated: number;
  brandCreated: number;
  socialConnected: number;
}

export interface UsageKpis {
  dau: number;
  wau: number;
  mau: number;
  publicationsCreated: number;
  publicationsPublished: number;
  aiGenerationCount: number;
  aiEstimatedCostUsd: number;
  workspacesUsingAi: number;
}

export interface PlanBreakdownRow {
  planKey: string;
  planName: string;
  workspaceCount: number;
}

export interface PlatformBreakdownRow {
  platform: string;
  connectedAccounts: number;
}

export interface FeatureUsageRow {
  featureKey: string;
  callCount: number;
}

export interface WorkspaceSizeBreakdown {
  solo: number;
  team: number;
}

export interface AdminBusinessSnapshot {
  period: PeriodPreset;
  totals: { profiles: number; workspaces: number; brands: number; connectedAccounts: number };
  funnel: FunnelCounts;
  usage: UsageKpis;
  planBreakdown: PlanBreakdownRow[];
  platformBreakdown: PlatformBreakdownRow[];
  topFeatures: FeatureUsageRow[];
  workspaceSize: WorkspaceSizeBreakdown;
  payingSubscriptions: number;
}

async function countDistinctUsers(
  supabase: ReturnType<typeof createSupabaseServiceRoleClient>,
  eventName: string,
  sinceIso?: string
): Promise<number> {
  let query = supabase.from("product_events").select("user_id").eq("event_name", eventName);
  if (sinceIso) query = query.gte("created_at", sinceIso);
  const { data } = await query;
  return new Set((data ?? []).map((row) => (row as { user_id: string }).user_id)).size;
}

async function countEvent(
  supabase: ReturnType<typeof createSupabaseServiceRoleClient>,
  eventName: string,
  sinceIso: string
): Promise<number> {
  const { count } = await supabase
    .from("product_events")
    .select("id", { count: "exact", head: true })
    .eq("event_name", eventName)
    .gte("created_at", sinceIso);
  return count ?? 0;
}

/**
 * Photographie des indicateurs business à partir de données réellement observées uniquement —
 * jamais de MRR/churn/ARPU fabriqués : `payingSubscriptions` reflète l'absence réelle
 * d'intégration Stripe (toujours 0 tant qu'aucun webhook réel n'écrit `workspace_subscriptions`
 * avec un statut "active"). Voir docs/FINAL-BETA-READINESS.md pour ce que cela signifie pour la
 * bêta.
 */
export async function getAdminBusinessSnapshot(period: PeriodPreset): Promise<AdminBusinessSnapshot> {
  const supabase = createSupabaseServiceRoleClient();
  const sinceIso = periodStartIso(period);
  const day1Iso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const day7Iso = periodStartIso("7");
  const day30Iso = periodStartIso("30");

  const [
    profilesRes,
    workspacesRes,
    brandsRes,
    accountsRes,
    publicationsCreatedRes,
    publicationsPublishedRes,
    aiUsageRes,
    subscriptionsRes,
    membersRes,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("workspaces").select("id", { count: "exact", head: true }),
    supabase.from("brands").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("accounts").select("platform").eq("status", "connected"),
    supabase.from("publications").select("id", { count: "exact", head: true }).is("deleted_at", null).gte("created_at", sinceIso),
    supabase.from("publications").select("id", { count: "exact", head: true }).is("deleted_at", null).eq("status", "published").gte("updated_at", sinceIso),
    supabase.from("ai_usage_events").select("feature_key, workspace_id, estimated_cost_usd").gte("created_at", sinceIso),
    supabase.from("workspace_subscriptions").select("plan_key, status"),
    supabase.from("workspace_members").select("workspace_id").eq("status", "active"),
  ]);

  // DAU/WAU/MAU se basent sur TOUT événement produit (pas seulement "signup") — activité réelle
  // récente, quel que soit le type d'action.
  async function distinctActiveUsersSince(iso: string): Promise<number> {
    const { data } = await supabase.from("product_events").select("user_id").gte("created_at", iso);
    return new Set((data ?? []).map((row) => (row as { user_id: string }).user_id)).size;
  }

  const [dau, wau, mau, signup, onboardingStarted, onboardingCompleted, workspaceCreated, brandCreated, socialConnected] =
    await Promise.all([
      distinctActiveUsersSince(day1Iso),
      distinctActiveUsersSince(day7Iso),
      distinctActiveUsersSince(day30Iso),
      countEvent(supabase, "signup", sinceIso),
      countDistinctUsers(supabase, "onboarding_started", sinceIso),
      countDistinctUsers(supabase, "onboarding_completed", sinceIso),
      countEvent(supabase, "workspace_created", sinceIso),
      countEvent(supabase, "brand_created", sinceIso),
      countDistinctUsers(supabase, "social_connected", sinceIso),
    ]);

  const aiRows = (aiUsageRes.data ?? []) as { feature_key: string; workspace_id: string; estimated_cost_usd: number }[];
  const aiEstimatedCostUsd = aiRows.reduce((sum, row) => sum + (row.estimated_cost_usd ?? 0), 0);
  const workspacesUsingAi = new Set(aiRows.map((row) => row.workspace_id)).size;
  const featureCounts = new Map<string, number>();
  for (const row of aiRows) featureCounts.set(row.feature_key, (featureCounts.get(row.feature_key) ?? 0) + 1);
  const topFeatures: FeatureUsageRow[] = Array.from(featureCounts.entries())
    .map(([featureKey, callCount]) => ({ featureKey, callCount }))
    .sort((a, b) => b.callCount - a.callCount)
    .slice(0, 8);

  const accountRows = (accountsRes.data ?? []) as { platform: string }[];
  const platformCounts = new Map<string, number>();
  for (const row of accountRows) platformCounts.set(row.platform, (platformCounts.get(row.platform) ?? 0) + 1);
  const platformBreakdown: PlatformBreakdownRow[] = Array.from(platformCounts.entries())
    .map(([platform, connectedAccounts]) => ({ platform, connectedAccounts }))
    .sort((a, b) => b.connectedAccounts - a.connectedAccounts);

  const subscriptionRows = (subscriptionsRes.data ?? []) as { plan_key: string; status: string }[];
  const planCounts = new Map<string, number>();
  for (const row of subscriptionRows) planCounts.set(row.plan_key, (planCounts.get(row.plan_key) ?? 0) + 1);
  const { data: planRows } = await supabase.from("plans").select("key, name").order("sort_order", { ascending: true });
  const planNameByKey = new Map(((planRows ?? []) as { key: string; name: string }[]).map((p) => [p.key, p.name]));
  const planBreakdown: PlanBreakdownRow[] = Array.from(planCounts.entries()).map(([planKey, workspaceCount]) => ({
    planKey,
    planName: planNameByKey.get(planKey) ?? planKey,
    workspaceCount,
  }));
  const payingSubscriptions = subscriptionRows.filter((row) => row.status === "active" || row.status === "trialing").length;

  const memberRows = (membersRes.data ?? []) as { workspace_id: string }[];
  const membersByWorkspace = new Map<string, number>();
  for (const row of memberRows) membersByWorkspace.set(row.workspace_id, (membersByWorkspace.get(row.workspace_id) ?? 0) + 1);
  let solo = 0;
  let team = 0;
  for (const count of membersByWorkspace.values()) {
    if (count <= 1) solo += 1;
    else team += 1;
  }

  return {
    period,
    totals: {
      profiles: profilesRes.count ?? 0,
      workspaces: workspacesRes.count ?? 0,
      brands: brandsRes.count ?? 0,
      connectedAccounts: accountRows.length,
    },
    funnel: { signup, onboardingStarted, onboardingCompleted, workspaceCreated, brandCreated, socialConnected },
    usage: {
      dau,
      wau,
      mau,
      publicationsCreated: publicationsCreatedRes.count ?? 0,
      publicationsPublished: publicationsPublishedRes.count ?? 0,
      aiGenerationCount: aiRows.length,
      aiEstimatedCostUsd,
      workspacesUsingAi,
    },
    planBreakdown,
    platformBreakdown,
    topFeatures,
    workspaceSize: { solo, team },
    payingSubscriptions,
  };
}
