"use client";

import { useState } from "react";
import { IdeaCard } from "@/components/idea-generator/IdeaCard";
import { IdeaGeneratorForm, type IdeaGeneratorFormValue } from "@/components/idea-generator/IdeaGeneratorForm";
import { brandProfiles } from "@/lib/brand-profiles";
import { connectedAccounts } from "@/lib/demo-data";
import { brandEditorialCalendars } from "@/lib/editorial-calendars";
import { generateIdeas, getPeriodDates, regenerateIdea, toISODate } from "@/lib/idea-generator";
import { usePostsSession } from "@/lib/posts-store";
import type { ContentIdea } from "@/types/idea-generator";
import type { Publication } from "@/types/publication";

function buildInitialFormValue(): IdeaGeneratorFormValue {
  const brand = brandProfiles[0];
  return {
    brandId: brand.id,
    periodType: "week",
    startDate: toISODate(new Date()),
    platforms: brand.socialPlatforms,
    count: 5,
  };
}

export function IdeaGeneratorView() {
  const { addPosts } = usePostsSession();
  const [formValue, setFormValue] = useState<IdeaGeneratorFormValue>(buildInitialFormValue);
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmation, setConfirmation] = useState<string | null>(null);

  function handleFormChange(next: IdeaGeneratorFormValue) {
    if (next.brandId !== formValue.brandId) {
      const brand = brandProfiles.find((b) => b.id === next.brandId);
      setFormValue({ ...next, platforms: brand?.socialPlatforms ?? [] });
    } else {
      setFormValue(next);
    }
  }

  function handleGenerate() {
    const brand = brandProfiles.find((b) => b.id === formValue.brandId);
    const calendar = brandEditorialCalendars.find((c) => c.brandId === formValue.brandId);
    setConfirmation(null);
    if (!brand || !calendar) {
      setIdeas([]);
      return;
    }

    const weekPlan = calendar.weekPlans[0];
    const dates = getPeriodDates(formValue.periodType, new Date(`${formValue.startDate}T00:00:00`));
    const newIdeas = generateIdeas(brand, weekPlan, dates, formValue.platforms, formValue.count);
    setIdeas(newIdeas);
    setSelectedIds(new Set());
  }

  function handleRegenerate(id: string) {
    const brand = brandProfiles.find((b) => b.id === formValue.brandId);
    if (!brand) return;
    setIdeas((prev) => prev.map((idea) => (idea.id === id ? regenerateIdea(idea, brand) : idea)));
  }

  function handleDelete(id: string) {
    setIdeas((prev) => prev.filter((idea) => idea.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => (prev.size === ideas.length ? new Set() : new Set(ideas.map((idea) => idea.id))));
  }

  function handleAddToCalendar() {
    const brand = brandProfiles.find((b) => b.id === formValue.brandId);
    if (!brand) return;

    const selected = ideas.filter((idea) => selectedIds.has(idea.id));
    if (selected.length === 0) return;

    const newPosts: Publication[] = selected.map((idea) => {
      const account =
        connectedAccounts.find((a) => a.brand === brand.name && a.platform === idea.platform) ??
        connectedAccounts.find((a) => a.brand === brand.name);

      return {
        id: crypto.randomUUID(),
        accountId: account?.id ?? "unassigned",
        platform: idea.platform,
        brand: brand.name,
        scheduledFor: `${idea.slot.date}T09:00:00`,
        timeZone: "America/Toronto",
        theme: idea.slot.themeLabel,
        format: idea.format,
        objective: idea.objective,
        excerpt: idea.subject,
        text: `${idea.angle} — ${idea.objective}`,
        cta: idea.cta,
        hashtags: [],
        firstComment: "",
        media: [],
        status: "draft",
        owner: "",
        approver: "",
        internalNotes: "",
      };
    });

    addPosts(newPosts);
    setIdeas((prev) => prev.filter((idea) => !selectedIds.has(idea.id)));
    setSelectedIds(new Set());
    setConfirmation(`${selected.length} idée(s) ajoutée(s) au calendrier comme brouillon.`);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Générateur d&apos;idées
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Génère des idées de contenu cohérentes avec le profil de marque et son calendrier
          éditorial (simulation déterministe, sans IA réelle).
        </p>
      </header>

      <IdeaGeneratorForm value={formValue} onChange={handleFormChange} onGenerate={handleGenerate} />

      {confirmation && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          {confirmation}
        </p>
      )}

      {ideas.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="text-sm font-medium text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
            >
              {selectedIds.size === ideas.length ? "Tout désélectionner" : "Tout sélectionner"}
            </button>
            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={handleAddToCalendar}
              className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
            >
              Ajouter au calendrier ({selectedIds.size})
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ideas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                isSelected={selectedIds.has(idea.id)}
                onToggleSelect={() => toggleSelect(idea.id)}
                onRegenerate={() => handleRegenerate(idea.id)}
                onDelete={() => handleDelete(idea.id)}
              />
            ))}
          </div>
        </>
      )}

      {ideas.length === 0 && (
        <p className="rounded-xl border border-dashed border-black/[.12] px-4 py-8 text-center text-sm text-zinc-400 dark:border-white/[.12] dark:text-zinc-600">
          Aucune idée générée pour l&apos;instant. Choisissez une marque, une période et cliquez sur
          &quot;Générer des idées&quot;.
        </p>
      )}
    </div>
  );
}
