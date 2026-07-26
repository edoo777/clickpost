"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { campaigns as SEED_CAMPAIGNS } from "@/lib/campaigns-data";
import type { Campaign } from "@/types/campaign";

interface CampaignsSessionValue {
  campaigns: Campaign[];
  addCampaign: (brandId: string, name: string) => void;
  updateCampaign: (id: string, patch: Partial<Campaign>) => void;
  removeCampaign: (id: string) => void;
}

const CampaignsSessionContext = createContext<CampaignsSessionValue | null>(null);

export function CampaignsSessionProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(SEED_CAMPAIGNS);

  const value = useMemo<CampaignsSessionValue>(
    () => ({
      campaigns,
      addCampaign: (brandId, name) =>
        setCampaigns((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            brandId,
            name,
            active: true,
            createdAt: new Date().toISOString(),
          },
        ]),
      updateCampaign: (id, patch) =>
        setCampaigns((prev) =>
          prev.map((campaign) => (campaign.id === id ? { ...campaign, ...patch } : campaign))
        ),
      removeCampaign: (id) => setCampaigns((prev) => prev.filter((campaign) => campaign.id !== id)),
    }),
    [campaigns]
  );

  return <CampaignsSessionContext.Provider value={value}>{children}</CampaignsSessionContext.Provider>;
}

export function useCampaignsSession() {
  const context = useContext(CampaignsSessionContext);
  if (!context) {
    throw new Error("useCampaignsSession must be used within a CampaignsSessionProvider");
  }
  return context;
}
