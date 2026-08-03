"use client";

import { useState } from "react";
import type { DisplayableTrend } from "@/components/trends/displayable-trend";
import type { TrendActionContext } from "@/components/trends/TrendActionsMenu";
import { TrendCard } from "@/components/trends/TrendCard";
import type { NewsSectionState } from "@/components/trends/PlatformNewsSection";
import { WebSearchQuotaPanel } from "@/components/trends/WebSearchQuotaPanel";
import { WebSearchTrigger } from "@/components/trends/WebSearchTrigger";
import type { YoutubeSectionState } from "@/components/trends/YoutubeTrendsSection";
import { dedupeDisplayable, newsItemToDisplayable, trendItemToDisplayable } from "@/lib/trends/display-mappers";
import type { SocialPlatform } from "@/types/dashboard";

const OVERVIEW_YOUTUBE_LIMIT = 4;
const OVERVIEW_NEWS_LIMIT = 4;
const ALL_WEB_SEARCH_PLATFORMS: SocialPlatform[] = ["youtube", "instagram", "facebook", "tiktok", "linkedin", "x", "pinterest", "threads"];

export function OverviewSection({
  youtube,
  news,
  context,
  brandName,
  niche,
  themeLabels,
  onOpenAdvice,
}: {
  youtube: YoutubeSectionState;
  news: NewsSectionState;
  context: TrendActionContext;
  brandName?: string;
  niche?: string;
  themeLabels: string[];
  onOpenAdvice: () => void;
}) {
  const [globalWebResults, setGlobalWebResults] = useState<DisplayableTrend[] | null>(null);
  const [searchCount, setSearchCount] = useState(0);
  const youtubeItems: DisplayableTrend[] =
    youtube.result?.status === "ok" ? youtube.result.items.map(trendItemToDisplayable).slice(0, OVERVIEW_YOUTUBE_LIMIT) : [];

  const newsItems: DisplayableTrend[] = news.result
    ? dedupeDisplayable(
        Object.values(news.result.platforms)
          .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry) && entry.status === "ok")
          .flatMap((entry) => entry.items.map(newsItemToDisplayable))
      )
        .sort((a, b) => new Date(b.publishedAt ?? b.collectedAt).getTime() - new Date(a.publishedAt ?? a.collectedAt).getTime())
        .slice(0, OVERVIEW_NEWS_LIMIT)
    : [];

  const nicheLower = niche?.trim().toLowerCase();
  const themeLower = themeLabels.map((label) => label.toLowerCase()).filter(Boolean);
  const relevantItems = dedupeDisplayable([...youtubeItems, ...newsItems]).filter((item) => {
    if (!nicheLower && themeLower.length === 0) return false;
    const haystack = `${item.title} ${item.description ?? ""}`.toLowerCase();
    return (nicheLower && haystack.includes(nicheLower)) || themeLower.some((label) => haystack.includes(label));
  });

  const sources = [
    youtube.result?.status === "ok" ? "YouTube Data API v3" : null,
    news.result ? "Flux officiels des plateformes (YouTube, Meta Newsroom, Pinterest Newsroom)" : null,
  ].filter((value): value is string => Boolean(value));

  const lastUpdatedCandidates = [youtube.result?.collectedAt, news.result?.collectedAt].filter((value): value is string => Boolean(value));
  const lastUpdated = lastUpdatedCandidates.length > 0 ? lastUpdatedCandidates.sort().at(-1) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-border bg-surface p-4">
        <p className="text-xs text-muted-foreground">
          Dernière actualisation : {lastUpdated ? new Date(lastUpdated).toLocaleString("fr-CA") : "—"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Sources utilisées : {sources.length > 0 ? sources.join(" · ") : "aucune donnée collectée pour l'instant"}
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">Tendances YouTube importantes</h2>
        {youtubeItems.length === 0 ? (
          <p className="text-xs text-muted-foreground">Aucune donnée disponible pour l&apos;instant — voir l&apos;onglet YouTube.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {youtubeItems.map((trend) => (
              <TrendCard
                key={trend.id}
                trend={trend}
                context={context}
                brandName={brandName}
                niche={niche}
                themeLabels={themeLabels}
                cacheAgeMs={youtube.result?.cacheAgeMs}
              />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">Actualités récentes des plateformes</h2>
        {newsItems.length === 0 ? (
          <p className="text-xs text-muted-foreground">Aucune donnée disponible pour l&apos;instant — voir l&apos;onglet Actualités.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {newsItems.map((trend) => (
              <TrendCard key={trend.id} trend={trend} context={context} brandName={brandName} niche={niche} themeLabels={themeLabels} />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">Sujets pertinents pour la marque active</h2>
        <p className="text-xs text-muted-foreground">
          Correspondance textuelle simple avec votre niche/thématique active — pas une analyse IA. Utilisez
          « Analyser avec Claude » sur un élément pour une explication réelle.
        </p>
        {relevantItems.length === 0 ? (
          <p className="text-xs text-muted-foreground">Aucune correspondance textuelle trouvée pour l&apos;instant.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {relevantItems.map((trend) => (
              <TrendCard key={`relevant-${trend.id}`} trend={trend} context={context} brandName={brandName} niche={niche} themeLabels={themeLabels} />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Veille Web — recherche globale</h2>
          <p className="text-xs text-muted-foreground">
            Complète les sources officielles quand elles ne suffisent pas — une seule recherche couvrant plusieurs
            plateformes à la fois, jamais automatique.
          </p>
        </div>
        <WebSearchTrigger
          params={{ mode: "global", focus: "platform_trends", platforms: ALL_WEB_SEARCH_PLATFORMS, niche, themeLabels, period: "7d" }}
          label="Rechercher les tendances (toutes plateformes)"
          onResults={(items) => {
            setGlobalWebResults(items);
            setSearchCount((prev) => prev + 1);
          }}
        />
        {globalWebResults && globalWebResults.length === 0 && (
          <p className="text-xs text-muted-foreground">Aucun signal récent suffisamment fiable n&apos;a été détecté.</p>
        )}
        {globalWebResults && globalWebResults.length > 0 && (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {globalWebResults.map((trend) => (
              <TrendCard key={trend.id} trend={trend} context={context} brandName={brandName} niche={niche} themeLabels={themeLabels} />
            ))}
          </div>
        )}
        <WebSearchQuotaPanel refreshKey={searchCount} />
      </section>

      <section className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-foreground">Opportunités recommandées</h2>
        <p className="text-xs text-muted-foreground">
          Aucune opportunité n&apos;est générée automatiquement ici — ouvrez l&apos;onglet « Conseils personnalisés » et
          sélectionnez un élément déjà collecté pour obtenir une analyse Claude réelle (pertinence, contenu, format,
          plateforme, risques).
        </p>
        <button
          type="button"
          onClick={onOpenAdvice}
          className="w-fit rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-xs font-semibold text-white"
        >
          Ouvrir Conseils personnalisés
        </button>
      </section>
    </div>
  );
}
