"use client";

import { useState } from "react";
import { ALL_CONTENT_TYPES, CONTENT_TYPE_LABEL, type ContentType } from "@/lib/content-types";
import { useBrandsSession } from "@/lib/brands-store";
import { CONTENT_FORMATS, useFormatLabel } from "@/lib/editorial-constants";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { IDEA_STATUS_ORDER, useIdeaStatusLabel, usePriorityLabel } from "@/lib/idea-status";
import { usePlatformLabel } from "@/lib/post-status";
import { getActiveThemesForBrand } from "@/lib/themes";
import { useThemesSession } from "@/lib/themes-store";
import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";
import type { IdeaNote } from "@/types/idea-note";
import type { IdeaStatus } from "@/types/idea";
import type { ContentPriority } from "@/types/publication";

const ALL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "x", "youtube"];
const ALL_PRIORITIES: ContentPriority[] = ["low", "medium", "high"];
const FIELD_CLASS = "w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-zinc-700   dark:text-zinc-300";

interface NotePropertiesPanelProps {
  note: IdeaNote;
  onChange: (patch: Partial<IdeaNote>) => void;
}

/** Panneau de propriétés facultatives de la note — réductible pour ne pas encombrer l'espace de
 * rédaction. Toutes les propriétés sont facultatives : la note s'enregistre sans aucune d'elles. */
export function NotePropertiesPanel({ note, onChange }: NotePropertiesPanelProps) {
  const t = useTranslations();
  const [isExpanded, setIsExpanded] = useState(false);
  const { brands } = useBrandsSession();
  const { themes } = useThemesSession();
  const IDEA_STATUS_LABEL = useIdeaStatusLabel();
  const PRIORITY_LABEL = usePriorityLabel();
  const PLATFORM_LABEL = usePlatformLabel();
  const FORMAT_LABEL = useFormatLabel();

  const brand = brands.find((candidate) => candidate.id === note.brandId);
  const themesForBrand = brand ? getActiveThemesForBrand(themes, brand.id) : [];

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3 ">
      <button type="button" onClick={() => setIsExpanded((prev) => !prev)} className="flex items-center justify-between text-left">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground ">
          {t("ideasBank.notePropertiesPanel.sectionLabel")}
        </span>
        <span className="text-xs text-muted-foreground ">{isExpanded ? t("nav.collapse") : t("ideasBank.notePropertiesPanel.show")}</span>
      </button>

      {isExpanded && (
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-0.5 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
            {t("ideaWorkshop.propertiesPanel.brandLabel")}
            <select
              value={note.brandId ?? ""}
              onChange={(event) => onChange({ brandId: event.target.value || undefined, themeId: undefined, adhocThemeLabel: undefined })}
              className={FIELD_CLASS}
            >
              <option value="">{t("ideasBank.notePropertiesPanel.noneStandalone")}</option>
              {brands.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-0.5 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
            {t("publications.claudeGeneration.niche")}
            {brand ? (
              <span className={`${FIELD_CLASS} text-muted-foreground`}>
                {brand.industry || t("ideasBank.notePropertiesPanel.notSpecified")}
              </span>
            ) : (
              <input
                value={note.standaloneNiche ?? ""}
                placeholder={t("publications.claudeGeneration.nichePlaceholder")}
                onChange={(event) => onChange({ standaloneNiche: event.target.value || undefined })}
                className={FIELD_CLASS}
              />
            )}
          </label>

          <label className="col-span-2 flex flex-col gap-0.5 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
            {t("ideaWorkshop.propertiesPanel.themeLabel")}
            <select
              value={note.themeId ?? ""}
              onChange={(event) => onChange({ themeId: event.target.value || undefined, adhocThemeLabel: undefined })}
              className={FIELD_CLASS}
            >
              <option value="">
                {note.adhocThemeLabel
                  ? t("ideasBank.notePropertiesPanel.adhocThemeSuffix", { label: note.adhocThemeLabel })
                  : t("publications.card.noTheme")}
              </option>
              {themesForBrand.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.label || t("publications.card.untitled")}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-0.5 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
            {t("ideasBank.notePropertiesPanel.contentTypeLabel")}
            <select
              value={note.contentType ?? ""}
              onChange={(event) => onChange({ contentType: (event.target.value || undefined) as ContentType | undefined })}
              className={FIELD_CLASS}
            >
              <option value="">{t("ideaWorkshop.propertiesPanel.notDefined")}</option>
              {ALL_CONTENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {CONTENT_TYPE_LABEL[type]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-0.5 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
            {t("publications.form.format")}
            <select
              value={note.format ?? ""}
              onChange={(event) => onChange({ format: (event.target.value || undefined) as ContentFormat | undefined })}
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

          <label className="col-span-2 flex flex-col gap-0.5 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
            {t("publications.form.objective")}
            <input value={note.objective ?? ""} onChange={(event) => onChange({ objective: event.target.value || undefined })} className={FIELD_CLASS} />
          </label>

          <label className="flex flex-col gap-0.5 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
            {t("ideasBank.notePropertiesPanel.platformLabel")}
            <select
              value={note.platform ?? ""}
              onChange={(event) => onChange({ platform: (event.target.value || undefined) as SocialPlatform | undefined })}
              className={FIELD_CLASS}
            >
              <option value="">{t("ideaWorkshop.propertiesPanel.notDefinedFem")}</option>
              {ALL_PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {PLATFORM_LABEL[platform]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-0.5 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
            {t("ideaWorkshop.propertiesPanel.statusLabel")}
            <select
              value={note.status ?? ""}
              onChange={(event) => onChange({ status: (event.target.value || undefined) as IdeaStatus | undefined })}
              className={FIELD_CLASS}
            >
              <option value="">{t("ideaWorkshop.propertiesPanel.notDefined")}</option>
              {IDEA_STATUS_ORDER.map((status) => (
                <option key={status} value={status}>
                  {IDEA_STATUS_LABEL[status]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-0.5 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
            {t("ideaWorkshop.propertiesPanel.priorityLabel")}
            <select
              value={note.priority ?? ""}
              onChange={(event) => onChange({ priority: (event.target.value || undefined) as ContentPriority | undefined })}
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

          <label className="flex flex-col gap-0.5 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
            {t("publications.promotion.owner")}
            <input value={note.owner ?? ""} onChange={(event) => onChange({ owner: event.target.value || undefined })} className={FIELD_CLASS} />
          </label>
        </div>
      )}
    </div>
  );
}
