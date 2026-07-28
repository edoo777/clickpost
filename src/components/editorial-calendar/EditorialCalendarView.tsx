"use client";

import { useState } from "react";
import { CalendarGenerationModal } from "@/components/calendar-generation/CalendarGenerationModal";
import { WeekGrid } from "@/components/editorial-calendar/WeekGrid";
import { brandProfiles } from "@/lib/brand-profiles";
import { useContentWorkspace } from "@/lib/content-workspace-store";
import { brandEditorialCalendars } from "@/lib/editorial-calendars";
import { getActiveThemesForBrand } from "@/lib/themes";
import { useThemesSession } from "@/lib/themes-store";
import type { BrandEditorialCalendar, EditorialDayPlan, EditorialWeekPlan } from "@/types/editorial-calendar";
import type { Idea } from "@/types/idea";

function cloneWeekPlan(plan: EditorialWeekPlan): EditorialWeekPlan {
  return {
    ...plan,
    days: plan.days.map((day) => ({
      ...day,
      themeIds: [...day.themeIds],
      platforms: [...day.platforms],
      formats: [...day.formats],
    })),
  };
}

export function EditorialCalendarView() {
  const { themes } = useThemesSession();
  const { addIdea } = useContentWorkspace();
  const [calendars, setCalendars] = useState<BrandEditorialCalendar[]>(() =>
    brandEditorialCalendars.map((calendar) => ({
      ...calendar,
      weekPlans: calendar.weekPlans.map(cloneWeekPlan),
    }))
  );
  const [selectedBrandId, setSelectedBrandId] = useState(calendars[0].brandId);
  const currentCalendar = calendars.find((c) => c.brandId === selectedBrandId) ?? calendars[0];
  const [selectedPlanId, setSelectedPlanId] = useState(currentCalendar.weekPlans[0].id);
  const [isEditing, setIsEditing] = useState(false);
  const [draftPlan, setDraftPlan] = useState<EditorialWeekPlan | null>(null);
  const [isGenerationModalOpen, setIsGenerationModalOpen] = useState(false);

  const currentPlan =
    currentCalendar.weekPlans.find((p) => p.id === selectedPlanId) ?? currentCalendar.weekPlans[0];
  const displayedPlan = isEditing && draftPlan ? draftPlan : currentPlan;
  const brandThemes = getActiveThemesForBrand(themes, selectedBrandId);

  function handleSelectBrand(brandId: string) {
    setSelectedBrandId(brandId);
    const calendar = calendars.find((c) => c.brandId === brandId);
    if (calendar) setSelectedPlanId(calendar.weekPlans[0].id);
    setIsEditing(false);
    setDraftPlan(null);
  }

  function handleSelectPlan(planId: string) {
    setSelectedPlanId(planId);
    setIsEditing(false);
    setDraftPlan(null);
  }

  function startEditing() {
    setDraftPlan(cloneWeekPlan(currentPlan));
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setDraftPlan(null);
  }

  function saveEditing() {
    if (!draftPlan) return;
    const finalPlan = draftPlan;
    setCalendars((prev) =>
      prev.map((calendar) =>
        calendar.brandId !== selectedBrandId
          ? calendar
          : {
              ...calendar,
              weekPlans: calendar.weekPlans.map((plan) => (plan.id === finalPlan.id ? finalPlan : plan)),
            }
      )
    );
    setIsEditing(false);
    setDraftPlan(null);
  }

  function handleChangeDay(day: EditorialDayPlan) {
    setDraftPlan((prev) =>
      prev ? { ...prev, days: prev.days.map((d) => (d.day === day.day ? day : d)) } : prev
    );
  }

  function handleRenamePlan(label: string) {
    setDraftPlan((prev) => (prev ? { ...prev, label } : prev));
  }

  function duplicatePlan() {
    const source = displayedPlan;
    const newPlan: EditorialWeekPlan = {
      ...cloneWeekPlan(source),
      id: crypto.randomUUID(),
      label: `Copie de ${source.label}`,
    };
    setCalendars((prev) =>
      prev.map((calendar) =>
        calendar.brandId !== selectedBrandId
          ? calendar
          : { ...calendar, weekPlans: [...calendar.weekPlans, newPlan] }
      )
    );
    setSelectedPlanId(newPlan.id);
    setIsEditing(false);
    setDraftPlan(null);
  }

  function handleConfirmGeneration(ideas: Idea[]) {
    ideas.forEach((idea) => addIdea(idea));
    setIsGenerationModalOpen(false);
  }

  const selectedBrand = brandProfiles.find((b) => b.id === selectedBrandId);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground ">
          Calendrier éditorial
        </h1>
        <p className="text-sm text-muted-foreground ">
          Définissez les thématiques récurrentes de chaque marque pour guider la génération de
          contenu.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedBrandId}
            onChange={(event) => handleSelectBrand(event.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-zinc-700   dark:text-zinc-300"
          >
            {calendars.map((calendar) => {
              const brand = brandProfiles.find((b) => b.id === calendar.brandId);
              return (
                <option key={calendar.brandId} value={calendar.brandId}>
                  {brand?.name ?? calendar.brandId}
                </option>
              );
            })}
          </select>

          <div className="flex flex-wrap items-center gap-1.5">
            {currentCalendar.weekPlans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => handleSelectPlan(plan.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  plan.id === selectedPlanId
                    ? "border-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm shadow-fuchsia-500/20"
                    : "border-border text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
                }`}
              >
                {plan.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={cancelEditing}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={saveEditing}
                className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40"
              >
                Enregistrer
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsGenerationModalOpen(true)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
              >
                Générer les idées depuis ce plan
              </button>
              <button
                type="button"
                onClick={duplicatePlan}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
              >
                Dupliquer cette semaine
              </button>
              <button
                type="button"
                onClick={startEditing}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
              >
                Modifier
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="flex flex-col gap-3">
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
            Les modifications restent en mémoire pour cette session uniquement — elles seront
            perdues au rechargement de la page.
          </p>
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Nom de la semaine
            <input
              value={displayedPlan.label}
              onChange={(event) => handleRenamePlan(event.target.value)}
              className="w-full max-w-sm rounded-lg border border-border bg-surface px-3 py-2 text-sm text-zinc-800   dark:text-zinc-200"
            />
          </label>
        </div>
      )}

      <WeekGrid plan={displayedPlan} themes={brandThemes} editable={isEditing} onChangeDay={handleChangeDay} />

      {isGenerationModalOpen && selectedBrand && (
        <CalendarGenerationModal
          brand={selectedBrand}
          weekPlan={currentPlan}
          themes={brandThemes}
          onClose={() => setIsGenerationModalOpen(false)}
          onConfirm={handleConfirmGeneration}
        />
      )}
    </div>
  );
}
