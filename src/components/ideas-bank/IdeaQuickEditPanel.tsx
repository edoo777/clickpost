"use client";

import Link from "next/link";
import { useState } from "react";
import { brandProfiles } from "@/lib/brand-profiles";
import { useCampaignsSession } from "@/lib/campaigns-store";
import { CONTENT_FORMATS, FORMAT_LABEL } from "@/lib/editorial-constants";
import { IDEA_STATUS_LABEL, IDEA_STATUS_STYLE, PRIORITY_LABEL } from "@/lib/idea-status";
import { PLATFORM_LABEL } from "@/lib/post-status";
import { getActiveThemesForBrand } from "@/lib/themes";
import { useThemesSession } from "@/lib/themes-store";
import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";
import type { Idea } from "@/types/idea";
import type { ContentPriority } from "@/types/publication";

const ALL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "x", "youtube"];
const ALL_PRIORITIES: ContentPriority[] = ["low", "medium", "high"];

const FIELD_CLASS =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-zinc-800   dark:text-zinc-200";

export interface IdeaQuickEditValue {
  title: string;
  brandId: string;
  themeId: string;
  campaignId: string;
  description: string;
  priority: ContentPriority | "";
  platform: SocialPlatform | "";
  format: ContentFormat | "";
  scheduledFor: string;
  datePending: boolean;
  owner: string;
  quickNotes: string;
}

function buildValueFromIdea(idea: Idea): IdeaQuickEditValue {
  return {
    title: idea.title,
    brandId: idea.brandId,
    themeId: idea.themeId ?? "",
    campaignId: idea.campaignId ?? "",
    description: idea.description ?? "",
    priority: idea.priority ?? "",
    platform: idea.platform ?? "",
    format: idea.format ?? "",
    scheduledFor: idea.scheduledFor ? idea.scheduledFor.slice(0, 16) : "",
    datePending: !idea.scheduledFor,
    owner: idea.owner ?? "",
    quickNotes: idea.quickNotes ?? "",
  };
}

function buildBlankValue(defaultBrandId: string): IdeaQuickEditValue {
  return {
    title: "",
    brandId: defaultBrandId,
    themeId: "",
    campaignId: "",
    description: "",
    priority: "",
    platform: "",
    format: "",
    scheduledFor: "",
    datePending: true,
    owner: "",
    quickNotes: "",
  };
}

interface IdeaQuickEditPanelProps {
  idea: Idea | null;
  defaultBrandId: string;
  onClose: () => void;
  onSave: (value: IdeaQuickEditValue) => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}

export function IdeaQuickEditPanel({
  idea,
  defaultBrandId,
  onClose,
  onSave,
  onDuplicate,
  onArchive,
  onRestore,
  onDelete,
}: IdeaQuickEditPanelProps) {
  const { themes } = useThemesSession();
  const { campaigns } = useCampaignsSession();
  const [value, setValue] = useState<IdeaQuickEditValue>(() =>
    idea ? buildValueFromIdea(idea) : buildBlankValue(defaultBrandId)
  );

  const themesForBrand = getActiveThemesForBrand(themes, value.brandId);
  const campaignsForBrand = campaigns.filter((campaign) => campaign.brandId === value.brandId && campaign.active);

  function set<K extends keyof IdeaQuickEditValue>(key: K, next: IdeaQuickEditValue[K]) {
    setValue((prev) => ({ ...prev, [key]: next }));
  }

  function handleBrandChange(brandId: string) {
    setValue((prev) => ({ ...prev, brandId, themeId: "", campaignId: "" }));
  }

  function handleSubmit() {
    if (!value.title.trim()) return;
    onSave(value);
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" role="dialog" aria-modal="true">
      <div className="flex h-full w-full max-w-md flex-col gap-4 overflow-y-auto border-l border-border bg-surface p-5  ">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground ">
            {idea ? "Modifier l'idée" : "Nouvelle idée"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted  "
          >
            ✕
          </button>
        </div>

        {idea && (
          <span
            className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${IDEA_STATUS_STYLE[idea.status]}`}
          >
            {IDEA_STATUS_LABEL[idea.status]}
          </span>
        )}

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Sujet / titre
          <input value={value.title} onChange={(event) => set("title", event.target.value)} className={FIELD_CLASS} />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Marque
          <select
            value={value.brandId}
            onChange={(event) => handleBrandChange(event.target.value)}
            className={FIELD_CLASS}
          >
            {brandProfiles.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Thématique
          <select
            value={value.themeId}
            onChange={(event) => set("themeId", event.target.value)}
            className={FIELD_CLASS}
          >
            <option value="">Sans thématique</option>
            {themesForBrand.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.label || "Sans titre"}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Campagne
          <select
            value={value.campaignId}
            onChange={(event) => set("campaignId", event.target.value)}
            className={FIELD_CLASS}
          >
            <option value="">Aucune campagne</option>
            {campaignsForBrand.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Description courte
          <textarea
            rows={2}
            value={value.description}
            onChange={(event) => set("description", event.target.value)}
            className={FIELD_CLASS}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Réseau
            <select
              value={value.platform}
              onChange={(event) => set("platform", event.target.value as SocialPlatform | "")}
              className={FIELD_CLASS}
            >
              <option value="">Non défini</option>
              {ALL_PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {PLATFORM_LABEL[platform]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Format
            <select
              value={value.format}
              onChange={(event) => set("format", event.target.value as ContentFormat | "")}
              className={FIELD_CLASS}
            >
              <option value="">Non défini</option>
              {CONTENT_FORMATS.map((format) => (
                <option key={format} value={format}>
                  {FORMAT_LABEL[format]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Priorité
          <select
            value={value.priority}
            onChange={(event) => set("priority", event.target.value as ContentPriority | "")}
            className={FIELD_CLASS}
          >
            <option value="">Non définie</option>
            {ALL_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_LABEL[priority]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Date prévue
          <input
            type="datetime-local"
            disabled={value.datePending}
            value={value.scheduledFor}
            onChange={(event) => set("scheduledFor", event.target.value)}
            className={FIELD_CLASS}
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={value.datePending}
            onChange={(event) => set("datePending", event.target.checked)}
          />
          Je ne connais pas encore la date
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Responsable
          <input value={value.owner} onChange={(event) => set("owner", event.target.value)} className={FIELD_CLASS} />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Notes rapides
          <textarea
            rows={2}
            value={value.quickNotes}
            onChange={(event) => set("quickNotes", event.target.value)}
            className={FIELD_CLASS}
          />
        </label>

        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40"
          >
            Enregistrer
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
          >
            Annuler
          </button>
        </div>

        {idea && (
          <div className="flex flex-wrap gap-2 border-t border-border pt-4 ">
            <Link
              href={`/atelier/${idea.id}`}
              className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40 dark:shadow-fuchsia-500/10"
            >
              Ouvrir l&apos;atelier
            </Link>
            <button
              type="button"
              onClick={onDuplicate}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
            >
              Dupliquer
            </button>
            {idea.status === "archived" ? (
              <button
                type="button"
                onClick={onRestore}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
              >
                Restaurer
              </button>
            ) : (
              <button
                type="button"
                onClick={onArchive}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
              >
                Archiver
              </button>
            )}
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              Supprimer
            </button>
            {idea.publicationId && (
              <Link
                href={`/publications/${idea.publicationId}`}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
              >
                Voir la publication
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
