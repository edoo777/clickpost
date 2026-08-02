"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AdviceSection } from "@/components/trends/AdviceSection";
import type { DisplayableTrend } from "@/components/trends/displayable-trend";
import { MusicTrendsSection } from "@/components/trends/MusicTrendsSection";
import { OverviewSection } from "@/components/trends/OverviewSection";
import { PlatformNewsSection, type NewsSectionState } from "@/components/trends/PlatformNewsSection";
import { buildDefaultFilters, TrendsFilterBar, type TrendFilters } from "@/components/trends/TrendsFilterBar";
import { YoutubeTrendsSection, type YoutubeSectionState } from "@/components/trends/YoutubeTrendsSection";
import { IconTrendingUp } from "@/components/icons";
import { useBrandsSession } from "@/lib/brands-store";
import { useThemesSession } from "@/lib/themes-store";
import { getActiveThemesForBrand } from "@/lib/themes";
import { fetchPlatformNews, fetchYoutubeTrends } from "@/lib/trends/client";
import { dedupeDisplayable, newsItemToDisplayable, trendItemToDisplayable } from "@/lib/trends/display-mappers";

type TrendsTab = "overview" | "youtube" | "news" | "advice" | "music";

const TABS: { key: TrendsTab; label: string }[] = [
  { key: "overview", label: "Vue d'ensemble" },
  { key: "youtube", label: "Tendances YouTube" },
  { key: "news", label: "Actualités des plateformes" },
  { key: "advice", label: "Conseils personnalisés" },
  { key: "music", label: "Musiques et sons" },
];

export function TrendsView() {
  const { activeBrand } = useBrandsSession();
  const { themes } = useThemesSession();
  const brandThemes = activeBrand ? getActiveThemesForBrand(themes, activeBrand.id) : [];

  const [tab, setTab] = useState<TrendsTab>("overview");
  const [filters, setFilters] = useState<TrendFilters>(() => buildDefaultFilters(activeBrand, brandThemes));
  const hasInitializedFromBrand = useRef(false);

  useEffect(() => {
    if (hasInitializedFromBrand.current || !activeBrand) return;
    // Appel différé hors du corps synchrone de l'effet (règle react-hooks/set-state-in-effect),
    // même patron que WorkspaceSessionProvider.
    const timeout = setTimeout(() => {
      hasInitializedFromBrand.current = true;
      setFilters(buildDefaultFilters(activeBrand, brandThemes));
    }, 0);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ne réagit qu'une fois, au premier chargement réel de la marque active.
  }, [activeBrand]);

  const [youtube, setYoutube] = useState<YoutubeSectionState>({ status: "loading" });
  const [news, setNews] = useState<NewsSectionState>({ status: "loading" });

  // Empêche toute mise à jour d'état après démontage (navigation hors de /tendances pendant
  // qu'une requête est en vol) — les fonctions ci-dessous sont aussi appelées directement par les
  // boutons « Actualiser », donc un simple nettoyage d'effet ne suffirait pas à lui seul.
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadYoutube = useCallback(async (refresh = false) => {
    setYoutube((prev) => ({ status: "loading", result: prev.result }));
    const result = await fetchYoutubeTrends({ country: filters.country, refresh });
    if (!isMountedRef.current) return;
    setYoutube({ status: "ready", result });
  }, [filters.country]);

  const loadNews = useCallback(async (refresh = false) => {
    setNews((prev) => ({ status: "loading", result: prev.result }));
    const result = await fetchPlatformNews({ refresh });
    if (!isMountedRef.current) return;
    setNews({ status: "ready", result });
  }, []);

  // Chargement à l'ouverture de la page et lorsque le pays change explicitement (choix manuel du
  // filtre) — jamais de sondage périodique ni de rafraîchissement automatique en arrière-plan.
  // Appel différé hors du corps synchrone de l'effet (règle react-hooks/set-state-in-effect).
  useEffect(() => {
    const timeout = setTimeout(() => void loadYoutube(), 0);
    return () => clearTimeout(timeout);
  }, [loadYoutube]);
  useEffect(() => {
    const timeout = setTimeout(() => void loadNews(), 0);
    return () => clearTimeout(timeout);
  }, [loadNews]);

  const selectedTheme = brandThemes.find((theme) => theme.label === filters.themeLabel);
  const context = { brandId: activeBrand?.id, themeId: selectedTheme?.id };
  const themeLabels = filters.themeLabel ? [filters.themeLabel] : brandThemes.map((theme) => theme.label);

  const combinedItems: DisplayableTrend[] = dedupeDisplayable([
    ...(youtube.result?.status === "ok" ? youtube.result.items.map(trendItemToDisplayable) : []),
    ...(news.result
      ? Object.values(news.result.platforms)
          .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry) && entry.status === "ok")
          .flatMap((entry) => entry.items.map(newsItemToDisplayable))
      : []),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <span className="accent-halo flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600">
            <IconTrendingUp className="h-5 w-5 text-white" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tendances</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Sources officielles, publiques et traçables uniquement — YouTube Data API v3 et flux officiels des
          plateformes. Aucune donnée inventée, aucun scraping, aucun faux temps réel.
        </p>
      </header>

      <TrendsFilterBar filters={filters} onChange={setFilters} activeBrand={activeBrand} brandThemes={brandThemes} />

      <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-surface p-1.5">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              tab === item.key
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-fuchsia-500/25"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <OverviewSection
          youtube={youtube}
          news={news}
          context={context}
          brandName={activeBrand?.name}
          niche={filters.niche}
          themeLabels={themeLabels}
          onOpenAdvice={() => setTab("advice")}
        />
      )}
      {tab === "youtube" && (
        <YoutubeTrendsSection
          state={youtube}
          filters={filters}
          onRefresh={() => void loadYoutube(true)}
          context={context}
          brandName={activeBrand?.name}
          niche={filters.niche}
          themeLabels={themeLabels}
        />
      )}
      {tab === "news" && (
        <PlatformNewsSection
          state={news}
          filters={filters}
          onRefresh={() => void loadNews(true)}
          context={context}
          brandName={activeBrand?.name}
          niche={filters.niche}
          themeLabels={themeLabels}
        />
      )}
      {tab === "advice" && (
        <AdviceSection items={combinedItems} brandName={activeBrand?.name} niche={filters.niche} themeLabels={themeLabels} />
      )}
      {tab === "music" && <MusicTrendsSection />}
    </div>
  );
}
