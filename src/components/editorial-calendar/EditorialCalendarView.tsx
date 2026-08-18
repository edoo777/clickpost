"use client";

import { useState } from "react";
import { CalendarGenerationModal } from "@/components/calendar-generation/CalendarGenerationModal";
import { WeekGrid } from "@/components/editorial-calendar/WeekGrid";
import { useBrandsSession } from "@/lib/brands-store";
import { useContentWorkspace } from "@/lib/content-workspace-store";
import { brandEditorialCalendars } from "@/lib/editorial-calendars";
import { WEEKDAYS } from "@/lib/editorial-constants";
import { useTranslations, type TranslationKey } from "@/lib/i18n/locale-provider";
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

function buildEmptyWeekPlan(t: (key: TranslationKey) => string): EditorialWeekPlan {
  return {
    id: crypto.randomUUID(),
    label: t("calendar.editorial.view.defaultPlanLabel"),
    days: WEEKDAYS.map((day) => ({ day, enabled: false, themeIds: [], platforms: [], formats: [], frequency: 0 })),
  };
}

/** Calendrier d'un brand réel — reprend le modèle de démonstration (Nova Cosmetics) uniquement
 * si son id correspond exactement (jamais le cas pour un vrai brand, dont l'id est un UUID) ;
 * sinon un plan vide que l'utilisateur construit lui-même. Ne jamais réutiliser tel quel un
 * calendrier de démonstration pour un vrai brand : ses thématiques (`theme-nova-1`, etc.) ne
 * correspondent à aucune thématique réelle du workspace. */
function buildCalendarForBrand(brandId: string, t: (key: TranslationKey) => string): BrandEditorialCalendar {
  const seedCalendar = brandEditorialCalendars.find((calendar) => calendar.brandId === brandId);
  if (seedCalendar) return { ...seedCalendar, weekPlans: seedCalendar.weekPlans.map(cloneWeekPlan) };
  return { brandId, weekPlans: [buildEmptyWeekPlan(t)] };
}

export function EditorialCalendarView() {
  const t = useTranslations();
  const { brands } = useBrandsSession();
  const { themes } = useThemesSession();
  const { addIdea } = useContentWorkspace();
  const [calendars, setCalendars] = useState<BrandEditorialCalendar[]>(() => brands.map((brand) => buildCalendarForBrand(brand.id, t)));
  const [selectedBrandId, setSelectedBrandId] = useState(brands[0]?.id ?? "");

  // Ajustement pendant le rendu (motif déjà utilisé ailleurs dans l'app, ex. AssistantCopilotView)
  // plutôt que dans un effet : garde `calendars`/`selectedBrandId` synchronisés dès qu'un vrai
  // brand apparaît/disparaît (nouveau brand créé pendant que la page est ouverte, suppression...).
  const brandIdsKey = brands.map((brand) => brand.id).join(",");
  const [trackedBrandIdsKey, setTrackedBrandIdsKey] = useState(brandIdsKey);
  if (brandIdsKey !== trackedBrandIdsKey) {
    setTrackedBrandIdsKey(brandIdsKey);
    const missing = brands.filter((brand) => !calendars.some((calendar) => calendar.brandId === brand.id));
    if (missing.length > 0) {
      setCalendars((prev) => [...prev, ...missing.map((brand) => buildCalendarForBrand(brand.id, t))]);
    }
    if (!selectedBrandId || !brands.some((brand) => brand.id === selectedBrandId)) {
      setSelectedBrandId(brands[0]?.id ?? "");
    }
  }

  const currentCalendar = calendars.find((c) => c.brandId === selectedBrandId) ?? calendars[0];
  const [selectedPlanId, setSelectedPlanId] = useState(currentCalendar?.weekPlans[0]?.id ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [draftPlan, setDraftPlan] = useState<EditorialWeekPlan | null>(null);
  const [isGenerationModalOpen, setIsGenerationModalOpen] = useState(false);

  const currentPlan = currentCalendar?.weekPlans.find((p) => p.id === selectedPlanId) ?? currentCalendar?.weekPlans[0];
  const displayedPlan = isEditing && draftPlan ? draftPlan : currentPlan;
  const brandThemes = getActiveThemesForBrand(themes, selectedBrandId);

  function handleSelectBrand(brandId: string) {
    setSelectedBrandId(brandId);
    const calendar = calendars.find((c) => c.brandId === brandId);
    if (calendar) setSelectedPlanId(calendar.weekPlans[0].id);
    setIsEditing(false);
    setDraftPlan(null);
  }

  if (brands.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("pageTitle.editorialCalendar")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("calendar.editorial.view.subtitle")}
          </p>
        </header>
        <p className="rounded-xl border border-dashed border-zinc-300 bg-surface px-6 py-10 text-center text-sm text-muted-foreground dark:border-white/[.16]">
          {t("calendar.editorial.view.emptyBrands")}
        </p>
      </div>
    );
  }

  if (!currentCalendar || !currentPlan) return null;

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
      label: t("calendar.editorial.view.copyOfPrefix", { label: source.label }),
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

  const selectedBrand = brands.find((b) => b.id === selectedBrandId);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground ">
          {t("pageTitle.editorialCalendar")}
        </h1>
        <p className="text-sm text-muted-foreground ">
          {t("calendar.editorial.view.subtitle")}
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedBrandId}
            onChange={(event) => handleSelectBrand(event.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-zinc-700   dark:text-zinc-300"
          >
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
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
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={saveEditing}
                className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40"
              >
                {t("common.save")}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsGenerationModalOpen(true)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
              >
                {t("calendar.editorial.view.generateIdeas")}
              </button>
              <button
                type="button"
                onClick={duplicatePlan}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
              >
                {t("calendar.editorial.view.duplicateWeek")}
              </button>
              <button
                type="button"
                onClick={startEditing}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
              >
                {t("common.edit")}
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="flex flex-col gap-3">
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
            {t("calendar.editorial.view.sessionOnlyWarning")}
          </p>
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("calendar.editorial.view.weekNameLabel")}
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
