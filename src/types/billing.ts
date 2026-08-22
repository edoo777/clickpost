export interface Plan {
  key: string;
  name: string;
  description: string;
  priceUsdCents: number | null;
  aiGenerationQuotaMonthly: number | null;
  maxBrands: number | null;
  maxSocialAccounts: number | null;
  maxWorkspaceMembers: number | null;
  features: Record<string, boolean>;
  isDefault: boolean;
  active: boolean;
}

export type SubscriptionStatus = "none" | "trialing" | "active" | "past_due" | "canceled";

export interface WorkspaceSubscription {
  workspaceId: string;
  planKey: string;
  status: SubscriptionStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  canceledAt: string | null;
  /** Accès bêta temporaire (voir src/lib/billing/beta-codes.ts) — jamais le plan réel, une
   * superposition distincte : `planKey`/`status` ci-dessus restent la source de vérité Stripe,
   * jamais modifiés par une redemption de code. `null` si aucun code n'a jamais été utilisé, ou
   * si l'accès a été révoqué. */
  betaPlanKey: string | null;
  betaExpiresAt: string | null;
  betaCodeId: string | null;
}

/** Accès bêta actif au moment de la lecture — dérivé, jamais stocké tel quel (voir
 * getWorkspacePlanContext : recalculé à chaque appel à partir de `betaExpiresAt`). */
export interface ActiveBetaAccess {
  planKey: string;
  expiresAt: string;
}

export interface BetaCode {
  id: string;
  code: string;
  planKey: string;
  grantDurationDays: number;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  createdAt: string;
  createdBy: string | null;
}
