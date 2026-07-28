"use client";

import { useMemo, useState } from "react";
import { WEEKDAY_LABEL } from "@/lib/editorial-constants";
import { distributeAcrossActiveDays, type IdeaScheduleAssignment } from "@/lib/idea-scheduling";
import type { BrandEditorialCalendar } from "@/types/editorial-calendar";
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

interface BulkScheduleModalProps {
  ideas: Idea[];
  isMixedBrands: boolean;
  calendar: BrandEditorialCalendar | undefined;
  themes: Theme[];
  onClose: () => void;
  onConfirm: (assignments: IdeaScheduleAssignment[]) => void;
}

export function BulkScheduleModal({
  ideas,
  isMixedBrands,
  calendar,
  themes,
  onClose,
  onConfirm,
}: BulkScheduleModalProps) {
  const [startDate, setStartDate] = useState(todayInputValue());

  const weekPlan = calendar?.weekPlans[0];
  const hasActiveDay = weekPlan ? weekPlan.days.some((day) => day.enabled) : false;
  const blocked = isMixedBrands || !calendar || !hasActiveDay;

  const result = useMemo(() => {
    if (blocked || !weekPlan) return null;
    return distributeAcrossActiveDays(ideas.map((idea) => idea.id), weekPlan, parseDateInput(startDate));
  }, [blocked, weekPlan, ideas, startDate]);

  function themeLabelsFor(themeIds: string[]): string {
    const labels = themeIds
      .map((id) => themes.find((theme) => theme.id === id)?.label)
      .filter((label): label is string => Boolean(label));
    return labels.length > 0 ? labels.join(", ") : "Aucune thématique planifiée ce jour-là";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-5 dark:border-white/[.08] dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Planifier la sélection</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            Fermer
          </button>
        </div>

        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {ideas.length} idée{ideas.length > 1 ? "s" : ""} sélectionnée{ideas.length > 1 ? "s" : ""}
        </p>

        {isMixedBrands ? (
          <p className={WARNING_CLASS}>Sélectionnez des idées d&apos;une seule marque pour planifier en groupe.</p>
        ) : !calendar ? (
          <p className={WARNING_CLASS}>Aucun calendrier éditorial trouvé pour cette marque.</p>
        ) : !hasActiveDay ? (
          <p className={WARNING_CLASS}>Aucun jour actif dans le calendrier éditorial de cette marque.</p>
        ) : (
          <>
            <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Date de départ
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className={FIELD_CLASS}
              />
            </label>

            {result && result.assignments.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-zinc-100 pt-3 dark:border-white/[.06]">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-600">
                  Aperçu de la distribution
                </h3>
                <ul className="flex flex-col gap-2 text-sm">
                  {result.assignments.map((assignment) => {
                    const idea = ideas.find((candidate) => candidate.id === assignment.ideaId);
                    return (
                      <li
                        key={assignment.ideaId}
                        className="flex flex-col gap-0.5 rounded-lg border border-zinc-100 px-3 py-2 dark:border-white/[.06]"
                      >
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">
                          {idea?.title || "Sans titre"}
                        </span>
                        <span className="text-xs text-zinc-400 dark:text-zinc-600">
                          {WEEKDAY_LABEL[assignment.weekday]} {dateFormatter.format(new Date(assignment.scheduledFor))} ·{" "}
                          {themeLabelsFor(assignment.themeIds)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {result && result.unassignedIds.length > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {result.unassignedIds.length} idée(s) n&apos;ont pas pu recevoir de date dans la période recherchée.
              </p>
            )}
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
            disabled={blocked || !result || result.assignments.length === 0}
            onClick={() => result && onConfirm(result.assignments)}
            className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40 disabled:cursor-not-allowed disabled:opacity-40 dark:shadow-fuchsia-500/10"
          >
            Distribuer les dates
          </button>
        </div>
      </div>
    </div>
  );
}
