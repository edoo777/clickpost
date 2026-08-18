"use client";

import { useState } from "react";
import { useBrandsSession } from "@/lib/brands-store";
import { useContentWorkspace } from "@/lib/content-workspace-store";
import { buildIdeaFromSeed, useDevelopIdea } from "@/lib/develop-idea";
import {
  ACTION_LABEL,
  type OptimizationActionKey,
  type OptimizationRecommendation,
} from "@/lib/optimization-recommendations";

const KIND_LABEL: Record<OptimizationRecommendation["kind"], string> = {
  finding: "Constat",
  recommendation: "Recommandation",
  hypothesis: "Hypothèse à tester",
};

const KIND_STYLE: Record<OptimizationRecommendation["kind"], string> = {
  finding: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  recommendation: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  hypothesis: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
};

interface OptimizationPanelProps {
  recommendations: OptimizationRecommendation[];
  /** Marque actuellement filtrée sur la page Performances — les idées créées depuis une action
   * doivent atterrir sur cette marque, jamais sur la première marque du workspace par défaut. */
  brandId?: string;
}

/**
 * Aucune de ces recommandations ne provient d'un appel Claude au chargement — uniquement des
 * calculs déterministes sur les données déjà affichées (voir optimization-recommendations.ts).
 * Chaque action crée réellement une idée et ouvre l'Atelier existant ; "Ignorer" ne fait
 * disparaître la carte que localement, sans jamais supprimer de donnée.
 */
export function OptimizationPanel({ recommendations, brandId }: OptimizationPanelProps) {
  const { brands } = useBrandsSession();
  const { addIdea } = useContentWorkspace();
  const { developIdea } = useDevelopIdea();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const visible = recommendations.filter((recommendation) => !dismissedIds.has(recommendation.id));

  function resolveBrandId(): string {
    return brandId ?? brands[0]?.id ?? "";
  }

  function handleAction(recommendation: OptimizationRecommendation, action: OptimizationActionKey) {
    if (action === "dismiss") {
      setDismissedIds((prev) => new Set(prev).add(recommendation.id));
      return;
    }
    if (action === "calendar") {
      // "Ajouter au calendrier" ne peut pas déposer directement une publication programmée : une
      // idée doit d'abord passer par l'Atelier (seul endroit où on lui assigne un format complet
      // et une date) avant d'apparaître sur /calendrier, qui n'affiche que la table publications,
      // jamais les idées. Même parcours que les autres actions ci-dessous, jamais une redirection
      // directe vers un calendrier qui ne montrerait rien de nouveau.
      const idea = buildIdeaFromSeed({
        brandId: resolveBrandId(),
        title: recommendation.seedTitle,
        platform: recommendation.seedPlatform,
        format: recommendation.seedFormat,
      });
      addIdea(idea);
      developIdea(idea, "manual");
      return;
    }
    if (action === "recycle" || action === "variant") {
      const source = recommendation.sourcePublication;
      const idea = buildIdeaFromSeed({
        brandId: resolveBrandId(),
        title: recommendation.seedTitle,
        platform: recommendation.seedPlatform,
        format: recommendation.seedFormat,
        body: source?.text,
      });
      addIdea(idea);
      developIdea(idea, "manual");
      return;
    }
    if (action === "test") {
      const idea = buildIdeaFromSeed({
        brandId: resolveBrandId(),
        title: `[Test éditorial] ${recommendation.seedTitle}`,
        platform: recommendation.seedPlatform,
        format: recommendation.seedFormat,
        quickNotes: `Hypothèse à vérifier : ${recommendation.text}`,
      });
      addIdea(idea);
      developIdea(idea, "manual");
      return;
    }
    // new_idea
    const idea = buildIdeaFromSeed({
      brandId: resolveBrandId(),
      title: recommendation.seedTitle,
      platform: recommendation.seedPlatform,
      format: recommendation.seedFormat,
    });
    addIdea(idea);
    developIdea(idea, "manual");
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5  ">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-foreground ">Optimisation</h2>
        <p className="text-xs text-muted-foreground ">
          Constats calculés à partir des données affichées ci-dessus — jamais générés
          automatiquement par Claude. Chaque carte distingue un constat vérifiable, une
          recommandation qui en découle, ou une hypothèse à tester.
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        {visible.map((recommendation) => (
          <li key={recommendation.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <span className={`w-fit rounded-full px-2 py-0.5 text-[11px] font-medium ${KIND_STYLE[recommendation.kind]}`}>
                {KIND_LABEL[recommendation.kind]}
              </span>
            </div>
            <p className="text-sm text-zinc-800 dark:text-zinc-100">{recommendation.text}</p>
            <p className="text-xs italic text-muted-foreground ">{recommendation.dataBasis}</p>
            {recommendation.actions.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {recommendation.actions.map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => handleAction(recommendation, action)}
                    className={
                      action === "dismiss"
                        ? "rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-zinc-500 hover:bg-muted "
                        : "rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
                    }
                  >
                    {ACTION_LABEL[action]}
                  </button>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
