"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { setStoredActiveBrandId, useStoredActiveBrandId } from "@/lib/active-brand-store";
import { useSyncedPersistedState } from "@/lib/sync/use-synced-state";
import { useWorkspaceSession } from "@/lib/supabase/workspace-provider";
import type { Brand } from "@/types/brand";
import type { SocialPlatform } from "@/types/dashboard";

export interface BrandDraft {
  name: string;
  industry?: string;
  description?: string;
  productsAndServices?: string[];
  targetAudience?: string;
  communicationGoals?: string[];
  toneOfVoice?: string;
  languages?: string[];
  priorityTopics?: string[];
  topicsToAvoid?: string[];
  preferredPhrases?: string[];
  forbiddenWords?: string[];
  preferredCtas?: string[];
  socialPlatforms?: SocialPlatform[];
  logoUrl?: string;
  website?: string;
  timeZone?: string;
  colorPrimary?: string;
  colorSecondary?: string;
}

interface BrandsSessionValue {
  /** Marques réelles du workspace, non supprimées (actives + archivées). */
  brands: Brand[];
  /** Sous-ensemble au statut actif — seules éligibles à devenir la marque active. */
  selectableBrands: Brand[];
  activeBrand: Brand | null;
  activeBrandId: string | null;
  setActiveBrandId: (id: string | null) => void;
  /** Écriture (création/modification/archivage/suppression) réservée aux owners/admins. */
  canManageBrands: boolean;
  createBrand: (draft: BrandDraft) => Brand;
  updateBrand: (id: string, patch: Partial<BrandDraft>) => void;
  archiveBrand: (id: string) => void;
  restoreBrand: (id: string) => void;
  deleteBrand: (id: string) => void;
}

const BrandsSessionContext = createContext<BrandsSessionValue | null>(null);

export function BrandsSessionProvider({ children }: { children: ReactNode }) {
  const { workspace, userId, isAdmin } = useWorkspaceSession();
  const [brands, setBrands] = useSyncedPersistedState<"brands">("brands", [], "brands");
  const storedActiveBrandId = useStoredActiveBrandId();

  const liveBrands = useMemo(() => brands.filter((brand) => !brand.deletedAt), [brands]);
  const selectableBrands = useMemo(
    () => liveBrands.filter((brand) => brand.status === "active"),
    [liveBrands]
  );

  const activeBrand = useMemo(() => {
    const fromPreference = storedActiveBrandId
      ? selectableBrands.find((brand) => brand.id === storedActiveBrandId)
      : undefined;
    return fromPreference ?? selectableBrands[0] ?? null;
  }, [selectableBrands, storedActiveBrandId]);

  // Corrige la préférence persistée si elle est absente, périmée (marque archivée/supprimée
  // ou d'un autre appareil) ou s'il n'existe plus aucune marque réelle sélectionnable —
  // jamais de sélection automatique d'une marque de démonstration, jamais silencieuse ici :
  // la préférence stockée reflète toujours la marque active réellement retenue.
  useEffect(() => {
    const nextId = activeBrand?.id ?? null;
    if (nextId !== storedActiveBrandId) setStoredActiveBrandId(nextId);
  }, [activeBrand, storedActiveBrandId]);

  const value = useMemo<BrandsSessionValue>(
    () => ({
      brands: liveBrands,
      selectableBrands,
      activeBrand,
      activeBrandId: activeBrand?.id ?? null,
      setActiveBrandId: setStoredActiveBrandId,
      canManageBrands: isAdmin,
      createBrand: (draft) => {
        const now = new Date().toISOString();
        const brand: Brand = {
          id: crypto.randomUUID(),
          workspaceId: workspace?.id ?? "",
          name: draft.name,
          industry: draft.industry ?? "",
          description: draft.description ?? "",
          productsAndServices: draft.productsAndServices ?? [],
          targetAudience: draft.targetAudience ?? "",
          communicationGoals: draft.communicationGoals ?? [],
          toneOfVoice: draft.toneOfVoice ?? "",
          languages: draft.languages ?? [],
          priorityTopics: draft.priorityTopics ?? [],
          topicsToAvoid: draft.topicsToAvoid ?? [],
          preferredPhrases: draft.preferredPhrases ?? [],
          forbiddenWords: draft.forbiddenWords ?? [],
          preferredCtas: draft.preferredCtas ?? [],
          socialPlatforms: draft.socialPlatforms ?? [],
          contentExamples: [],
          logoUrl: draft.logoUrl,
          website: draft.website,
          timeZone: draft.timeZone,
          colorPrimary: draft.colorPrimary,
          colorSecondary: draft.colorSecondary,
          status: "active",
          createdBy: userId ?? "",
          createdAt: now,
          updatedAt: now,
          revision: 1,
        };
        setBrands((prev) => [...prev, brand]);
        return brand;
      },
      updateBrand: (id, patch) =>
        setBrands((prev) =>
          prev.map((brand) =>
            brand.id === id ? { ...brand, ...patch, updatedAt: new Date().toISOString() } : brand
          )
        ),
      archiveBrand: (id) =>
        setBrands((prev) =>
          prev.map((brand) =>
            brand.id === id ? { ...brand, status: "archived", updatedAt: new Date().toISOString() } : brand
          )
        ),
      restoreBrand: (id) =>
        setBrands((prev) =>
          prev.map((brand) =>
            brand.id === id ? { ...brand, status: "active", updatedAt: new Date().toISOString() } : brand
          )
        ),
      deleteBrand: (id) =>
        setBrands((prev) =>
          prev.map((brand) =>
            brand.id === id
              ? { ...brand, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
              : brand
          )
        ),
    }),
    [liveBrands, selectableBrands, activeBrand, isAdmin, workspace?.id, userId, setBrands]
  );

  return <BrandsSessionContext.Provider value={value}>{children}</BrandsSessionContext.Provider>;
}

export function useBrandsSession() {
  const context = useContext(BrandsSessionContext);
  if (!context) {
    throw new Error("useBrandsSession must be used within a BrandsSessionProvider");
  }
  return context;
}
