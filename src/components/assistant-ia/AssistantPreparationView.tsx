"use client";

import Link from "next/link";
import { useState } from "react";
import { AssistantGenerationStep } from "@/components/assistant-ia/AssistantGenerationStep";
import { useBrandsSession } from "@/lib/brands-store";
import { brandEditorialCalendars } from "@/lib/editorial-calendars";
import { FORMAT_LABEL, WEEKDAY_LABEL } from "@/lib/editorial-constants";
import { getActiveDays } from "@/lib/idea-scheduling";
import { PLATFORM_LABEL } from "@/lib/post-status";
import { getActiveThemesForBrand } from "@/lib/themes";
import { useThemesSession } from "@/lib/themes-store";

type WizardStep = "brand" | "calendar" | "generation" | "done";

const STEP_LABELS: { key: WizardStep; label: string }[] = [
  { key: "brand", label: "1. Marque" },
  { key: "calendar", label: "2. Calendrier" },
  { key: "generation", label: "3. Génération" },
  { key: "done", label: "4. Confirmation" },
];

export function AssistantPreparationView() {
  const { brands } = useBrandsSession();
  const { themes } = useThemesSession();
  const [step, setStep] = useState<WizardStep>("brand");
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [createdCount, setCreatedCount] = useState(0);

  const brand = brands.find((candidate) => candidate.id === selectedBrandId);
  const calendar = selectedBrandId
    ? brandEditorialCalendars.find((candidate) => candidate.brandId === selectedBrandId)
    : undefined;
  const weekPlan = calendar?.weekPlans[0];
  const activeDays = weekPlan ? getActiveDays(weekPlan) : [];
  const brandThemes = selectedBrandId ? getActiveThemesForBrand(themes, selectedBrandId) : [];

  function handleSelectBrand(brandId: string) {
    setSelectedBrandId(brandId);
    setStep("calendar");
  }

  function handleRestart() {
    setSelectedBrandId(null);
    setCreatedCount(0);
    setStep("brand");
  }

  function handleGenerationComplete(count: number) {
    setCreatedCount(count);
    setStep("done");
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground ">
          Assistant IA de préparation
        </h1>
        <p className="text-sm text-muted-foreground ">
          Un parcours guidé, en mode démonstration, pour préparer rapidement le
          contenu d&apos;une marque à partir de son calendrier éditorial.
        </p>
      </header>

      <ol className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground ">
        {STEP_LABELS.map(({ key, label }) => (
          <li
            key={key}
            className={`rounded-full px-3 py-1 ${
              step === key
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm shadow-fuchsia-500/20"
                : "border border-border "
            }`}
          >
            {label}
          </li>
        ))}
      </ol>

      {step === "brand" && brands.length === 0 && (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-surface px-6 py-10 text-center text-sm text-muted-foreground dark:border-white/[.16] ">
          Aucune marque dans ce workspace. Créez-en une dans « Marques » pour utiliser l&apos;assistant.
        </p>
      )}

      {step === "brand" && brands.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              onClick={() => handleSelectBrand(candidate.id)}
              className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-5 text-left hover:border-zinc-400   dark:hover:border-white/[.16]"
            >
              <span className="text-sm font-semibold text-foreground ">{candidate.name}</span>
              <span className="text-xs text-muted-foreground ">{candidate.industry}</span>
              <span className="text-xs text-muted-foreground ">
                {candidate.toneOfVoice || "Aucun ton défini"}
              </span>
              {candidate.communicationGoals.length > 0 && (
                <ul className="flex flex-col gap-0.5 text-xs text-muted-foreground ">
                  {candidate.communicationGoals.slice(0, 2).map((goal) => (
                    <li key={goal}>· {goal}</li>
                  ))}
                </ul>
              )}
            </button>
          ))}
        </div>
      )}

      {step === "calendar" && brand && (
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5  ">
          <div>
            <h2 className="text-sm font-semibold text-foreground ">
              Étape 2 · Calendrier de {brand.name}
            </h2>
            <p className="text-sm text-muted-foreground ">
              {weekPlan ? `Plan « ${weekPlan.label} »` : "Aucun calendrier éditorial trouvé pour cette marque."}
            </p>
          </div>

          {activeDays.length === 0 ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
              Aucun jour actif dans le calendrier éditorial de cette marque. Configurez-en un dans{" "}
              <Link href="/calendrier" className="underline">
                le Calendrier
              </Link>
              , ou utilisez la voie manuelle du{" "}
              <Link href="/generateur-idees" className="underline">
                Générateur de sujets
              </Link>
              .
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {activeDays.map((day) => (
                <li
                  key={day.day}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm "
                >
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">{WEEKDAY_LABEL[day.day]}</span>
                  <span className="text-xs text-muted-foreground ">
                    {day.themeIds
                      .map((id) => brandThemes.find((theme) => theme.id === id)?.label)
                      .filter(Boolean)
                      .join(", ") || "Sans thématique"}
                  </span>
                  <span className="text-xs text-muted-foreground ">
                    {day.platforms.map((platform) => PLATFORM_LABEL[platform]).join(", ") || "Aucun réseau"} ·{" "}
                    {day.formats.map((format) => FORMAT_LABEL[format]).join(", ") || "Aucun format"} · {day.frequency}
                    /jour
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center justify-between border-t border-border pt-3 ">
            <button
              type="button"
              onClick={() => setStep("brand")}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
            >
              Retour
            </button>
            <button
              type="button"
              disabled={activeDays.length === 0}
              onClick={() => setStep("generation")}
              className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40 disabled:cursor-not-allowed disabled:opacity-40 dark:shadow-fuchsia-500/10"
            >
              Continuer
            </button>
          </div>
        </div>
      )}

      {step === "generation" && brand && weekPlan && (
        <AssistantGenerationStep
          brand={brand}
          weekPlan={weekPlan}
          themes={brandThemes}
          onBack={() => setStep("calendar")}
          onComplete={handleGenerationComplete}
        />
      )}

      {step === "done" && brand && (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            {createdCount} idée{createdCount > 1 ? "s" : ""} créée{createdCount > 1 ? "s" : ""} pour {brand.name}.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/banque-idees"
              className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40"
            >
              Voir la Banque d&apos;idées
            </Link>
            <Link
              href="/calendrier"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
            >
              Voir le Calendrier
            </Link>
            <button
              type="button"
              onClick={handleRestart}
              className="text-sm font-medium text-muted-foreground underline-offset-2 hover:underline "
            >
              Préparer une autre marque
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
