"use client";

import { useMemo, useState } from "react";
import { generateIdeasFromCalendar, type CalendarGeneratedIdeaPreview } from "@/lib/calendar-generation";
import { FORMAT_LABEL, WEEKDAY_LABEL } from "@/lib/editorial-constants";
import { PLATFORM_LABEL } from "@/lib/post-status";
import type { BrandProfile } from "@/types/brand";
import type { EditorialWeekPlan } from "@/types/editorial-calendar";
import type { Idea } from "@/types/idea";
import type { Theme } from "@/types/theme";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const FIELD_CLASS =
  "rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 dark:border-white/[.08] dark:bg-zinc-950 dark:text-zinc-300";

const WARNING_CLASS =
  "rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400";

function todayInputValue(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function parseDateInput(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year || 1970, (month || 1) - 1, day || 1);
}

interface CalendarGenerationModalProps {
  brand: BrandProfile;
  weekPlan: EditorialWeekPlan;
  themes: Theme[];
  onClose: () => void;
  onConfirm: (ideas: Idea[]) => void;
}

export function CalendarGenerationModal({ brand, weekPlan, themes, onClose, onConfirm }: CalendarGenerationModalProps) {
  const [startDate, setStartDate] = useState(todayInputValue());
  const [weekCount, setWeekCount] = useState(2);

  const previews = useMemo(
    () => generateIdeasFromCalendar({ weekPlan, startDate: parseDateInput(startDate), weekCount, themes, brand }),
    [weekPlan, startDate, weekCount, themes, brand]
  );

  const grouped = useMemo(() => {
    const byDate = new Map<string, CalendarGeneratedIdeaPreview[]>();
    previews.forEach((preview) => {
      const key = preview.scheduledFor.slice(0, 10);
      const list = byDate.get(key) ?? [];
      list.push(preview);
      byDate.set(key, list);
    });
    return [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [previews]);

  function handleConfirm() {
    const now = new Date().toISOString();
    const ideas: Idea[] = previews.map((preview) => ({
      id: preview.id,
      brandId: brand.id,
      themeId: preview.themeId,
      title: preview.title,
      source: "generated",
      status: "idea",
      platform: preview.platform,
      format: preview.format,
      scheduledFor: preview.scheduledFor,
      createdAt: now,
      updatedAt: now,
    }));
    onConfirm(ideas);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col gap-4 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-5 dark:border-white/[.08] dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Générer les idées depuis ce plan</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            Fermer
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Date de départ
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className={FIELD_CLASS}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Nombre de semaines
            <input
              type="number"
              min={1}
              max={8}
              value={weekCount}
              onChange={(event) => setWeekCount(Math.min(8, Math.max(1, Number(event.target.value) || 1)))}
              className={FIELD_CLASS}
            />
          </label>
        </div>

        {previews.length === 0 ? (
          <p className={WARNING_CLASS}>
            Aucun jour actif avec une fréquence supérieure à zéro dans ce plan de semaine — rien à générer.
          </p>
        ) : (
          <>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {previews.length} idée{previews.length > 1 ? "s" : ""} seront créées
            </p>
            <div className="flex flex-col gap-3">
              {grouped.map(([dateKey, dayPreviews]) => (
                <div
                  key={dateKey}
                  className="flex flex-col gap-2 rounded-lg border border-zinc-100 p-3 dark:border-white/[.06]"
                >
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-600">
                    {WEEKDAY_LABEL[dayPreviews[0].weekday]} {dateFormatter.format(new Date(dayPreviews[0].scheduledFor))} ·{" "}
                    {dayPreviews[0].themeLabel}
                  </h3>
                  <ul className="flex flex-col gap-1.5 text-sm">
                    {dayPreviews.map((preview) => (
                      <li key={preview.id} className="flex flex-wrap items-center gap-2">
                        <span className="text-zinc-800 dark:text-zinc-200">{preview.title}</span>
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                          {PLATFORM_LABEL[preview.platform]} · {FORMAT_LABEL[preview.format]}
                        </span>
                        {preview.isDuplicate && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                            Doublon possible
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-3 dark:border-white/[.06]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-white/[.1] dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={previews.length === 0}
            onClick={handleConfirm}
            className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40 disabled:cursor-not-allowed disabled:opacity-40 dark:shadow-fuchsia-500/10"
          >
            Créer les {previews.length} idée{previews.length > 1 ? "s" : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
