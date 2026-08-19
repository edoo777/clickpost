import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspacePlanContext } from "@/lib/billing/plans";

export interface AiQuotaCheck {
  allowed: boolean;
  used: number;
  /** `null` = illimité pour ce plan. */
  limit: number | null;
  planKey: string;
}

function currentMonthStartIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

/**
 * Contrôle de quota IA, appelé par chaque route `/api/ia/**` AVANT l'appel Claude — jamais après
 * coup (protège réellement la marge, pas seulement un affichage). Le quota se réinitialise au
 * début de chaque mois civil (UTC). Un plan avec `aiGenerationQuotaMonthly: null` (ex. "agency")
 * est illimité par conception. En cas d'erreur de lecture (base indisponible), on autorise
 * l'appel plutôt que de bloquer un utilisateur légitime — une panne de comptage ne doit jamais
 * devenir une panne de produit.
 */
export async function checkAiQuota(workspaceId: string): Promise<AiQuotaCheck> {
  const { plan } = await getWorkspacePlanContext(workspaceId);
  if (plan.aiGenerationQuotaMonthly === null) {
    return { allowed: true, used: 0, limit: null, planKey: plan.key };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { count } = await supabase
      .from("ai_usage_events")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .gte("created_at", currentMonthStartIso());
    const used = count ?? 0;
    return { allowed: used < plan.aiGenerationQuotaMonthly, used, limit: plan.aiGenerationQuotaMonthly, planKey: plan.key };
  } catch {
    return { allowed: true, used: 0, limit: plan.aiGenerationQuotaMonthly, planKey: plan.key };
  }
}
