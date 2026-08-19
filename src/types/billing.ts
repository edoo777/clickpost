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
}
