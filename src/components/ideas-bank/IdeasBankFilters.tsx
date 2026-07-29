"use client";

import { useBrandsSession } from "@/lib/brands-store";
import { useCampaignsSession } from "@/lib/campaigns-store";
import { CONTENT_FORMATS, FORMAT_LABEL } from "@/lib/editorial-constants";
import { IDEA_STATUS_ORDER, IDEA_STATUS_LABEL, PRIORITY_LABEL } from "@/lib/idea-status";
import { PLATFORM_LABEL } from "@/lib/post-status";
import { getThemesForBrand } from "@/lib/themes";
import { useThemesSession } from "@/lib/themes-store";
import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";
import type { IdeaStatus } from "@/types/idea";
import type { ContentPriority, ContentSource } from "@/types/publication";
import type { TopicBatch } from "@/types/topic-batch";

export type IdeasBankGroupBy = "none" | "theme" | "batch" | "campaign";
export type IdeasBankViewMode = "cards" | "table" | "kanban";

export interface IdeasBankFiltersValue {
  search: string;
  brandId: string | "all";
  themeId: string | "all";
  batchId: string | "all";
  campaignId: string | "all";
  source: ContentSource | "all";
  status: IdeaStatus | "all";
  priority: ContentPriority | "all";
  platform: SocialPlatform | "all";
  format: ContentFormat | "all";
  dateFrom: string;
  dateTo: string;
  transformState: "all" | "used" | "unused";
  includeArchived: boolean;
  groupBy: IdeasBankGroupBy;
  viewMode: IdeasBankViewMode;
}

export const DEFAULT_IDEAS_BANK_FILTERS: IdeasBankFiltersValue = {
  search: "",
  brandId: "all",
  themeId: "all",
  batchId: "all",
  campaignId: "all",
  source: "all",
  status: "all",
  priority: "all",
  platform: "all",
  format: "all",
  dateFrom: "",
  dateTo: "",
  transformState: "all",
  includeArchived: false,
  groupBy: "none",
  viewMode: "cards",
};

const ALL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "x", "youtube"];
const ALL_PRIORITIES: ContentPriority[] = ["low", "medium", "high"];

const FIELD_CLASS =
  "rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-zinc-700   dark:text-zinc-300";

interface IdeasBankFiltersProps {
  value: IdeasBankFiltersValue;
  onChange: (value: IdeasBankFiltersValue) => void;
  batches: TopicBatch[];
  onNewIdea: () => void;
}

export function IdeasBankFilters({ value, onChange, batches, onNewIdea }: IdeasBankFiltersProps) {
  const { brands } = useBrandsSession();
  const { themes } = useThemesSession();
  const { campaigns } = useCampaignsSession();

  const brandId = value.brandId !== "all" ? value.brandId : undefined;
  const themeOptions = brandId ? getThemesForBrand(themes, brandId) : themes;
  const batchOptions = brandId ? batches.filter((batch) => batch.brandId === brandId) : batches;
  const campaignOptions = brandId ? campaigns.filter((campaign) => campaign.brandId === brandId) : campaigns;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={value.search}
          onChange={(event) => onChange({ ...value, search: event.target.value })}
          placeholder="Rechercher une idée…"
          className={`${FIELD_CLASS} w-full sm:w-64`}
        />

        <select
          value={value.brandId}
          onChange={(event) => onChange({ ...value, brandId: event.target.value, themeId: "all", campaignId: "all", batchId: "all" })}
          className={FIELD_CLASS}
        >
          <option value="all">Toutes les marques</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>

        <select
          value={value.themeId}
          onChange={(event) => onChange({ ...value, themeId: event.target.value })}
          className={FIELD_CLASS}
        >
          <option value="all">Toutes les thématiques</option>
          {themeOptions.map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.label || "Sans titre"}
            </option>
          ))}
        </select>

        <select
          value={value.batchId}
          onChange={(event) => onChange({ ...value, batchId: event.target.value })}
          className={FIELD_CLASS}
        >
          <option value="all">Tous les blocs</option>
          {batchOptions.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.name}
            </option>
          ))}
        </select>

        <select
          value={value.campaignId}
          onChange={(event) => onChange({ ...value, campaignId: event.target.value })}
          className={FIELD_CLASS}
        >
          <option value="all">Toutes les campagnes</option>
          {campaignOptions.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={value.status}
          onChange={(event) => onChange({ ...value, status: event.target.value as IdeaStatus | "all" })}
          className={FIELD_CLASS}
        >
          <option value="all">Tous les statuts</option>
          {IDEA_STATUS_ORDER.map((status) => (
            <option key={status} value={status}>
              {IDEA_STATUS_LABEL[status]}
            </option>
          ))}
        </select>

        <select
          value={value.source}
          onChange={(event) => onChange({ ...value, source: event.target.value as ContentSource | "all" })}
          className={FIELD_CLASS}
        >
          <option value="all">Toutes les sources</option>
          <option value="manual">Manuelle</option>
          <option value="generated">Générée</option>
        </select>

        <select
          value={value.priority}
          onChange={(event) => onChange({ ...value, priority: event.target.value as ContentPriority | "all" })}
          className={FIELD_CLASS}
        >
          <option value="all">Toutes les priorités</option>
          {ALL_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {PRIORITY_LABEL[priority]}
            </option>
          ))}
        </select>

        <select
          value={value.platform}
          onChange={(event) => onChange({ ...value, platform: event.target.value as SocialPlatform | "all" })}
          className={FIELD_CLASS}
        >
          <option value="all">Tous les réseaux</option>
          {ALL_PLATFORMS.map((platform) => (
            <option key={platform} value={platform}>
              {PLATFORM_LABEL[platform]}
            </option>
          ))}
        </select>

        <select
          value={value.format}
          onChange={(event) => onChange({ ...value, format: event.target.value as ContentFormat | "all" })}
          className={FIELD_CLASS}
        >
          <option value="all">Tous les formats</option>
          {CONTENT_FORMATS.map((format) => (
            <option key={format} value={format}>
              {FORMAT_LABEL[format]}
            </option>
          ))}
        </select>

        <select
          value={value.transformState}
          onChange={(event) =>
            onChange({ ...value, transformState: event.target.value as IdeasBankFiltersValue["transformState"] })
          }
          className={FIELD_CLASS}
        >
          <option value="all">Utilisées et non utilisées</option>
          <option value="used">Déjà transformées</option>
          <option value="unused">Non transformées</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="date"
          value={value.dateFrom}
          onChange={(event) => onChange({ ...value, dateFrom: event.target.value })}
          aria-label="Du"
          className={FIELD_CLASS}
        />
        <input
          type="date"
          value={value.dateTo}
          onChange={(event) => onChange({ ...value, dateTo: event.target.value })}
          aria-label="Au"
          className={FIELD_CLASS}
        />

        <label className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
          <input
            type="checkbox"
            checked={value.includeArchived}
            onChange={(event) => onChange({ ...value, includeArchived: event.target.checked })}
          />
          Afficher les archivées
        </label>

        <select
          value={value.groupBy}
          onChange={(event) => onChange({ ...value, groupBy: event.target.value as IdeasBankGroupBy })}
          className={FIELD_CLASS}
        >
          <option value="none">Sans regroupement</option>
          <option value="theme">Regrouper par thématique</option>
          <option value="batch">Regrouper par bloc</option>
          <option value="campaign">Regrouper par campagne</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-border p-1 ">
          <button
            type="button"
            onClick={() => onChange({ ...value, viewMode: "cards" })}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              value.viewMode === "cards"
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm shadow-fuchsia-500/20"
                : "text-muted-foreground "
            }`}
          >
            Cartes
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...value, viewMode: "table" })}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              value.viewMode === "table"
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm shadow-fuchsia-500/20"
                : "text-muted-foreground "
            }`}
          >
            Tableau
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...value, viewMode: "kanban" })}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              value.viewMode === "kanban"
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm shadow-fuchsia-500/20"
                : "text-muted-foreground "
            }`}
          >
            Kanban
          </button>
        </div>

        <button
          type="button"
          onClick={onNewIdea}
          className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40"
        >
          + Nouvelle idée
        </button>
      </div>
    </div>
  );
}
