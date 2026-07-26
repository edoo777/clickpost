"use client";

import { useState } from "react";
import { WeekGrid } from "@/components/editorial-calendar/WeekGrid";
import { brandProfiles } from "@/lib/brand-profiles";
import { brandEditorialCalendars } from "@/lib/editorial-calendars";
import { getActiveThemesForBrand } from "@/lib/themes";
import { useThemesSession } from "@/lib/themes-store";
import type { BrandEditorialCalendar, EditorialDayPlan, EditorialWeekPlan } from "@/types/editorial-calendar";

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

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Calendrier éditorial
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Définissez les thématiques récurrentes de chaque marque pour guider la génération de
          contenu.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedBrandId}
            onChange={(event) => handleSelectBrand(event.target.value)}
            className="rounded-lg border border-black/[.08] bg-white px-3 py-1.5 text-sm text-zinc-700 dark:border-white/[.08] dark:bg-zinc-950 dark:text-zinc-300"
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
                    ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-black"
                    : "border-black/[.08] text-zinc-600 hover:bg-zinc-100 dark:border-white/[.08] dark:text-zinc-400 dark:hover:bg-zinc-900"
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
                className="rounded-lg border border-black/[.08] px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:border-white/[.08] dark:text-zinc-400 dark:hover:bg-zinc-900"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={saveEditing}
                className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
              >
                Enregistrer
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={duplicatePlan}
                className="rounded-lg border border-black/[.08] px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:border-white/[.08] dark:text-zinc-400 dark:hover:bg-zinc-900"
              >
                Dupliquer cette semaine
              </button>
              <button
                type="button"
                onClick={startEditing}
                className="rounded-lg border border-black/[.08] px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:border-white/[.08] dark:text-zinc-400 dark:hover:bg-zinc-900"
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
              className="w-full max-w-sm rounded-lg border border-black/[.08] bg-white px-3 py-2 text-sm text-zinc-800 dark:border-white/[.08] dark:bg-zinc-950 dark:text-zinc-200"
            />
          </label>
        </div>
      )}

      <WeekGrid plan={displayedPlan} themes={brandThemes} editable={isEditing} onChangeDay={handleChangeDay} />
    </div>
  );
}
