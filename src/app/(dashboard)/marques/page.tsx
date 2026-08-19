"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BrandCard } from "@/components/brands/BrandCard";
import { CreateBrandPanel } from "@/components/brands/CreateBrandPanel";
import { WorkspaceErrorNotice } from "@/components/shared/WorkspaceErrorNotice";
import { useBrandsSession, type BrandDraft } from "@/lib/brands-store";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { useWorkspaceSession } from "@/lib/supabase/workspace-provider";

type StatusFilter = "active" | "archived" | "all";

export default function BrandsPage() {
  const t = useTranslations();
  const router = useRouter();
  const { brands, activeBrandId, canManageBrands, createBrand } = useBrandsSession();
  const { isLoading: isWorkspaceLoading, workspaceError, refresh } = useWorkspaceSession();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [isCreating, setIsCreating] = useState(false);

  const filteredBrands = useMemo(() => {
    const query = search.trim().toLowerCase();
    return brands.filter((brand) => {
      if (statusFilter !== "all" && brand.status !== statusFilter) return false;
      if (!query) return true;
      return brand.name.toLowerCase().includes(query) || brand.industry.toLowerCase().includes(query);
    });
  }, [brands, search, statusFilter]);

  function handleCreate(input: BrandDraft) {
    const brand = createBrand(input);
    setIsCreating(false);
    router.push(`/marques/${brand.id}`);
  }

  const hasAnyBrand = brands.length > 0;
  // Un rôle réel n'est confirmé qu'une fois le workspace chargé sans erreur — tant que ce n'est
  // pas le cas, on ne se prononce jamais sur la permission (ni activé, ni « lecture seule »).
  const hasResolvedRole = !isWorkspaceLoading && !workspaceError;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground ">{t("pageTitle.brands")}</h1>
          <p className="text-sm text-muted-foreground ">
            {t("brands.listPage.subtitle")}
          </p>
        </div>
        {!hasResolvedRole ? (
          <button
            type="button"
            disabled
            aria-disabled="true"
            aria-busy={isWorkspaceLoading}
            title={workspaceError ? t("brands.listPage.roleUndetermined") : t("brands.listPage.roleLoading")}
            className="cursor-not-allowed rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground opacity-60"
          >
            {t("brands.listPage.newBrand")}
          </button>
        ) : canManageBrands ? (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40"
          >
            {t("brands.listPage.newBrand")}
          </button>
        ) : (
          <button
            type="button"
            disabled
            title={t("brands.listPage.restrictedToOwnerAdmin")}
            aria-disabled="true"
            className="cursor-not-allowed rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground opacity-60"
          >
            {t("brands.listPage.newBrand")}
          </button>
        )}
      </header>

      {isWorkspaceLoading && (
        <p className="rounded-lg bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400">
          {t("brands.listPage.loadingWorkspace")}
        </p>
      )}

      {workspaceError && <WorkspaceErrorNotice error={workspaceError} onRetry={() => void refresh()} />}

      {hasResolvedRole && !canManageBrands && (
        <p className="rounded-lg bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400">
          {t("brands.listPage.readOnlyRoleNotice")}
        </p>
      )}

      {hasAnyBrand && (
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("brands.listPage.searchPlaceholder")}
            className="w-full max-w-xs rounded-lg border border-border bg-surface px-3 py-2 text-sm text-zinc-800  dark:text-zinc-200"
          />
          <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1 ">
            {(
              [
                { value: "active", label: t("brands.listPage.filterActive") },
                { value: "archived", label: t("brands.listPage.filterArchived") },
                { value: "all", label: t("brands.listPage.filterAll") },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatusFilter(option.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === option.value
                    ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                    : "text-zinc-600 hover:bg-muted  dark:text-zinc-400"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {!hasAnyBrand ? (
        <div className="flex flex-col items-center gap-5 rounded-xl border border-dashed border-zinc-300 bg-surface px-6 py-16 text-center dark:border-white/[.16] ">
          <div className="flex flex-col items-center gap-2">
            <p className="text-base font-semibold text-foreground ">{t("brands.listPage.emptyTitle")}</p>
            <p className="max-w-sm text-sm text-muted-foreground ">
              {t("brands.listPage.emptyDescription")}
            </p>
          </div>
          {!hasResolvedRole ? (
            <p className="rounded-lg bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400">
              {workspaceError ? t("brands.listPage.roleUndeterminedRetry") : t("brands.listPage.roleLoading")}
            </p>
          ) : canManageBrands ? (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40"
            >
              {t("brands.listPage.createFirstBrand")}
            </button>
          ) : (
            <p className="rounded-lg bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400">
              {t("brands.listPage.askOwnerAdmin")}
            </p>
          )}
          <ol className="flex max-w-md flex-col gap-2 text-left text-xs text-muted-foreground ">
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">1</span>
              {t("brands.listPage.step1")}
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">2</span>
              {t("brands.listPage.step2")}
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">3</span>
              {t("brands.listPage.step3")}
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">4</span>
              {t("brands.listPage.step4")}
            </li>
          </ol>
        </div>
      ) : filteredBrands.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-surface px-6 py-10 text-center text-sm text-muted-foreground dark:border-white/[.16] ">
          {t("brands.listPage.noSearchResults")}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBrands.map((brand) => (
            <BrandCard key={brand.id} brand={brand} isActive={brand.id === activeBrandId} />
          ))}
        </div>
      )}

      {isCreating && (
        <CreateBrandPanel onClose={() => setIsCreating(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}
