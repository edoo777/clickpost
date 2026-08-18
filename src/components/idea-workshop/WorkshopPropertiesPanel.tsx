"use client";

import Link from "next/link";
import { useState } from "react";
import { TONE_LABEL, type GenerationTone } from "@/lib/assisted-generation";
import { CONTENT_FORMATS, useFormatLabel } from "@/lib/editorial-constants";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { IDEA_STATUS_ORDER, IDEA_STATUS_STYLE, useIdeaStatusLabel, usePriorityLabel } from "@/lib/idea-status";
import { usePlatformLabel } from "@/lib/post-status";
import type { Campaign } from "@/types/campaign";
import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";
import type { Idea, IdeaStatus } from "@/types/idea";
import type { ContentPriority, PublicationMedia } from "@/types/publication";

const ALL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "x", "youtube"];
const ALL_PRIORITIES: ContentPriority[] = ["low", "medium", "high"];
const ALL_TONES: GenerationTone[] = [
  "professional",
  "friendly",
  "enthusiastic",
  "direct",
  "pedagogical",
  "inspiring",
  "conversational",
  "expert",
  "storytelling",
  "provocative",
];

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const FIELD_CLASS = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200";
const LABEL_CLASS = "flex flex-col gap-1 text-xs font-medium text-muted-foreground";

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className={LABEL_CLASS}>
      {label}
      <span className="rounded-lg bg-muted px-3 py-2 text-sm text-foreground">{value || "—"}</span>
    </div>
  );
}

function TextField({
  label,
  value,
  multiline,
  onChange,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className={LABEL_CLASS}>
      {label}
      {multiline ? (
        <textarea rows={3} value={value} onChange={(event) => onChange(event.target.value)} className={FIELD_CLASS} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} className={FIELD_CLASS} />
      )}
    </label>
  );
}

function ListField({ label, value, onChange }: { label: string; value: string[]; onChange: (value: string[]) => void }) {
  const t = useTranslations();
  return (
    <label className={LABEL_CLASS}>
      {label}
      <textarea
        rows={3}
        value={value.join("\n")}
        placeholder={t("publications.form.onePerLine")}
        onChange={(event) => onChange(event.target.value.split("\n"))}
        className={FIELD_CLASS}
      />
    </label>
  );
}

function MediaField({ value, onChange }: { value: PublicationMedia[]; onChange: (value: PublicationMedia[]) => void }) {
  const t = useTranslations();
  function update(id: string, patch: Partial<PublicationMedia>) {
    onChange(value.map((media) => (media.id === id ? { ...media, ...patch } : media)));
  }
  function remove(id: string) {
    onChange(value.filter((media) => media.id !== id));
  }
  function add() {
    onChange([...value, { id: crypto.randomUUID(), type: "image", label: "" }]);
  }
  return (
    <div className="flex flex-col gap-2">
      {value.map((media) => (
        <div key={media.id} className="flex items-center gap-2 rounded-lg border border-border p-2">
          <select
            value={media.type}
            onChange={(event) => update(media.id, { type: event.target.value as PublicationMedia["type"] })}
            className={`${FIELD_CLASS} w-auto`}
          >
            <option value="image">{t("ideaWorkshop.propertiesPanel.mediaTypeImage")}</option>
            <option value="video">{t("ideaWorkshop.propertiesPanel.mediaTypeVideo")}</option>
          </select>
          <input
            value={media.label}
            placeholder={t("ideaWorkshop.propertiesPanel.mediaLabelPlaceholder")}
            onChange={(event) => update(media.id, { label: event.target.value })}
            className={FIELD_CLASS}
          />
          <button type="button" onClick={() => remove(media.id)} className="shrink-0 text-xs font-medium text-red-500 hover:underline">
            {t("common.delete")}
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="w-fit rounded-lg border border-dashed border-zinc-400 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-zinc-500 dark:border-white/[.16]"
      >
        + {t("ideaWorkshop.propertiesPanel.addMediaHint")}
      </button>
    </div>
  );
}

interface WorkshopPropertiesPanelProps {
  idea: Idea;
  brandLabel: string;
  themeLabel?: string;
  campaigns: Campaign[];
  onFieldChange: <K extends keyof Idea>(key: K, value: Idea[K]) => void;
  onStatusChange: (status: IdeaStatus) => void;
}

/**
 * Onglet « Propriétés » du panneau latéral droit — reprend l'ensemble des champs de l'ancien
 * Atelier (Détails, Réflexion, Rédaction annexe, Notes internes), simplement réorganisés pour ne
 * plus surcharger la feuille de rédaction centrale. Aucun champ n'a été supprimé.
 */
export function WorkshopPropertiesPanel({ idea, brandLabel, themeLabel, campaigns, onFieldChange, onStatusChange }: WorkshopPropertiesPanelProps) {
  const t = useTranslations();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const IDEA_STATUS_LABEL = useIdeaStatusLabel();
  const PRIORITY_LABEL = usePriorityLabel();
  const PLATFORM_LABEL = usePlatformLabel();
  const FORMAT_LABEL = useFormatLabel();
  const relevantCampaigns = campaigns.filter((campaign) => campaign.brandId === idea.brandId);

  return (
    <div className="flex flex-col gap-4">
      <div className={LABEL_CLASS}>
        {t("ideaWorkshop.propertiesPanel.statusLabel")}
        <select value={idea.status} onChange={(event) => onStatusChange(event.target.value as IdeaStatus)} className={FIELD_CLASS}>
          {IDEA_STATUS_ORDER.map((status) => (
            <option key={status} value={status}>
              {IDEA_STATUS_LABEL[status]}
            </option>
          ))}
        </select>
        <span className={`w-fit rounded-full px-2 py-0.5 text-xs font-medium ${IDEA_STATUS_STYLE[idea.status]}`}>
          {IDEA_STATUS_LABEL[idea.status]}
        </span>
      </div>

      {idea.derivedFromId && (
        <div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300">
          {t("ideaWorkshop.propertiesPanel.reusedContentPrefix")}{" "}
          <Link href={`/publications/${idea.derivedFromId}`} className="font-medium underline">
            {t("ideaWorkshop.propertiesPanel.viewOriginalPublication")}
          </Link>
        </div>
      )}

      <ReadOnlyField label={t("ideaWorkshop.propertiesPanel.brandLabel")} value={brandLabel} />
      <ReadOnlyField label={t("ideaWorkshop.propertiesPanel.themeLabel")} value={themeLabel ?? t("publications.card.noTheme")} />

      <label className={LABEL_CLASS}>
        {t("publications.form.network")}
        <select
          value={idea.platform ?? ""}
          onChange={(event) => onFieldChange("platform", (event.target.value || undefined) as SocialPlatform | undefined)}
          className={FIELD_CLASS}
        >
          <option value="">{t("ideaWorkshop.propertiesPanel.notDefined")}</option>
          {ALL_PLATFORMS.map((platform) => (
            <option key={platform} value={platform}>
              {PLATFORM_LABEL[platform]}
            </option>
          ))}
        </select>
      </label>

      <label className={LABEL_CLASS}>
        {t("publications.form.format")}
        <select
          value={idea.format ?? ""}
          onChange={(event) => onFieldChange("format", (event.target.value || undefined) as ContentFormat | undefined)}
          className={FIELD_CLASS}
        >
          <option value="">{t("ideaWorkshop.propertiesPanel.notDefined")}</option>
          {CONTENT_FORMATS.map((format) => (
            <option key={format} value={format}>
              {FORMAT_LABEL[format]}
            </option>
          ))}
        </select>
      </label>

      <TextField label={t("publications.form.objective")} value={idea.objective ?? ""} onChange={(value) => onFieldChange("objective", value)} />
      <TextField
        label={t("ideaWorkshop.propertiesPanel.targetAudienceLabel")}
        value={idea.targetAudience ?? ""}
        onChange={(value) => onFieldChange("targetAudience", value)}
      />

      <label className={LABEL_CLASS}>
        {t("publications.claudeGeneration.tone")}
        <select
          value={idea.tone ?? ""}
          onChange={(event) => onFieldChange("tone", (event.target.value || undefined) as GenerationTone | undefined)}
          className={FIELD_CLASS}
        >
          <option value="">{t("ideaWorkshop.propertiesPanel.notDefined")}</option>
          {ALL_TONES.map((tone) => (
            <option key={tone} value={tone}>
              {TONE_LABEL[tone]}
            </option>
          ))}
        </select>
      </label>

      <label className={LABEL_CLASS}>
        {t("ideaWorkshop.propertiesPanel.priorityLabel")}
        <select
          value={idea.priority ?? ""}
          onChange={(event) => onFieldChange("priority", (event.target.value || undefined) as ContentPriority | undefined)}
          className={FIELD_CLASS}
        >
          <option value="">{t("ideaWorkshop.propertiesPanel.notDefinedFem")}</option>
          {ALL_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {PRIORITY_LABEL[priority]}
            </option>
          ))}
        </select>
      </label>

      <label className={LABEL_CLASS}>
        {t("ideaWorkshop.propertiesPanel.campaignLabel")}
        <select
          value={idea.campaignId ?? ""}
          onChange={(event) => onFieldChange("campaignId", event.target.value || undefined)}
          className={FIELD_CLASS}
        >
          <option value="">{t("ideaWorkshop.propertiesPanel.noCampaign")}</option>
          {relevantCampaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.name}
            </option>
          ))}
        </select>
      </label>

      <div className={LABEL_CLASS}>
        {t("ideaWorkshop.propertiesPanel.scheduledDateLabel")}
        <input
          type="datetime-local"
          disabled={!idea.scheduledFor}
          value={idea.scheduledFor ? idea.scheduledFor.slice(0, 16) : ""}
          onChange={(event) => onFieldChange("scheduledFor", event.target.value)}
          className={FIELD_CLASS}
        />
        <label className="flex items-center gap-2 text-xs font-normal text-foreground">
          <input
            type="checkbox"
            checked={!idea.scheduledFor}
            onChange={(event) => onFieldChange("scheduledFor", event.target.checked ? undefined : new Date().toISOString().slice(0, 16))}
          />
          {t("ideaWorkshop.propertiesPanel.noDateYet")}
        </label>
      </div>

      <TextField label={t("publications.promotion.owner")} value={idea.owner ?? ""} onChange={(value) => onFieldChange("owner", value)} />

      <ReadOnlyField
        label={t("ideaWorkshop.propertiesPanel.sourceLabel")}
        value={idea.source === "generated" ? t("ideaWorkshop.propertiesPanel.sourceGenerated") : t("ideaWorkshop.propertiesPanel.sourceManual")}
      />
      <ReadOnlyField label={t("ideaWorkshop.propertiesPanel.createdAtLabel")} value={dateFormatter.format(new Date(idea.createdAt))} />
      <ReadOnlyField label={t("ideaWorkshop.propertiesPanel.updatedAtLabel")} value={dateFormatter.format(new Date(idea.updatedAt))} />

      <button
        type="button"
        onClick={() => setShowAdvanced((prev) => !prev)}
        aria-expanded={showAdvanced}
        className="mt-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
      >
        {showAdvanced
          ? t("ideaWorkshop.propertiesPanel.hideAdvancedDetails")
          : t("ideaWorkshop.propertiesPanel.showAdvancedDetails")}
      </button>

      {showAdvanced && (
        <div className="flex flex-col gap-4 border-t border-border pt-4">
          <TextField label={t("ideaWorkshop.propertiesPanel.angleLabel")} value={idea.angle ?? ""} onChange={(value) => onFieldChange("angle", value)} />
          <ListField
            label={t("ideaWorkshop.propertiesPanel.keyPointsLabel")}
            value={idea.keyPoints ?? []}
            onChange={(value) => onFieldChange("keyPoints", value)}
          />
          <ListField
            label={t("ideaWorkshop.propertiesPanel.referencesLabel")}
            value={idea.references ?? []}
            onChange={(value) => onFieldChange("references", value)}
          />
          <TextField
            label={t("ideaWorkshop.propertiesPanel.personalNotesLabel")}
            value={idea.personalNotes ?? ""}
            multiline
            onChange={(value) => onFieldChange("personalNotes", value)}
          />
          <TextField
            label={t("ideaWorkshop.propertiesPanel.conclusionLabel")}
            value={idea.conclusion ?? ""}
            multiline
            onChange={(value) => onFieldChange("conclusion", value)}
          />
          <ListField label={t("publications.form.hashtags")} value={idea.hashtags ?? []} onChange={(value) => onFieldChange("hashtags", value)} />
          <TextField
            label={t("publications.form.firstComment")}
            value={idea.firstComment ?? ""}
            onChange={(value) => onFieldChange("firstComment", value)}
          />
          <div className={LABEL_CLASS}>
            {t("publications.form.media")}
            <MediaField value={idea.media ?? []} onChange={(value) => onFieldChange("media", value)} />
          </div>
          <TextField
            label={t("publications.form.internalNotes")}
            value={idea.internalNotes ?? ""}
            multiline
            onChange={(value) => onFieldChange("internalNotes", value)}
          />
        </div>
      )}
    </div>
  );
}
