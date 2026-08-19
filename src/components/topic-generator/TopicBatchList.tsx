"use client";

import { useMemo, useState } from "react";
import { ALL_CONTENT_TYPES, CONTENT_TYPE_LABEL, type ContentType } from "@/lib/content-types";
import { useBrandsSession } from "@/lib/brands-store";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type { Topic, TopicBatch } from "@/types/topic-batch";

interface TopicBatchListProps {
  batches: TopicBatch[];
  topics: Topic[];
  themeLabelFor: (batch: TopicBatch) => string;
  /** Ouvre le groupe entier (toutes les thématiques générées ensemble) auquel appartient ce bloc. */
  onOpen: (groupId: string) => void;
}

type SortOrder = "recent" | "oldest";

const PAGE_SIZE = 12;

/**
 * « Mes sujets » — bibliothèque de tout le stock de contenu préparé (chaque génération par
 * thématique = un bloc), pensée pour rester lisible même avec des centaines de blocs : recherche,
 * filtres marque/thématique/type de contenu, tri, chargement progressif. Un clic ouvre le groupe
 * de génération complet (comportement inchangé, voir TopicGeneratorView.handleOpenGroup).
 */
export function TopicBatchList({ batches, topics, themeLabelFor, onOpen }: TopicBatchListProps) {
  const t = useTranslations();
  const { brands } = useBrandsSession();
  const [query, setQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [themeFilter, setThemeFilter] = useState("all");
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentType | "all">("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("recent");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const topicsByBatch = useMemo(() => {
    const map = new Map<string, Topic[]>();
    for (const topic of topics) {
      const existing = map.get(topic.batchId) ?? [];
      existing.push(topic);
      map.set(topic.batchId, existing);
    }
    return map;
  }, [topics]);

  const themeOptions = useMemo(() => {
    const labels = new Set(batches.map((batch) => themeLabelFor(batch)));
    return Array.from(labels).sort((a, b) => a.localeCompare(b));
  }, [batches, themeLabelFor]);

  const enriched = useMemo(() => {
    return batches.map((batch) => {
      const batchTopics = topicsByBatch.get(batch.id) ?? [];
      const brand = brands.find((candidate) => candidate.id === batch.brandId);
      const contentTypes = new Set(batchTopics.map((topic) => topic.contentType).filter((value): value is ContentType => Boolean(value)));
      return {
        batch,
        brandName: brand?.name ?? (batch.brandId ? batch.brandId : t("topicGenerator.batchList.standaloneBrand")),
        themeLabel: themeLabelFor(batch),
        topicCount: batchTopics.length,
        contentTypes,
      };
    });
  }, [batches, topicsByBatch, brands, themeLabelFor, t]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return enriched.filter(({ batch, brandName, themeLabel, contentTypes }) => {
      if (brandFilter !== "all" && batch.brandId !== brandFilter) return false;
      if (themeFilter !== "all" && themeLabel !== themeFilter) return false;
      if (contentTypeFilter !== "all" && !contentTypes.has(contentTypeFilter)) return false;
      if (!normalizedQuery) return true;
      const haystack = `${batch.name} ${brandName} ${themeLabel} ${batch.instructions ?? ""}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [enriched, query, brandFilter, themeFilter, contentTypeFilter]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const diff = new Date(a.batch.createdAt).getTime() - new Date(b.batch.createdAt).getTime();
      return sortOrder === "recent" ? -diff : diff;
    });
    return copy;
  }, [filtered, sortOrder]);

  const visible = sorted.slice(0, visibleCount);
  const hasMore = sorted.length > visible.length;

  if (batches.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-muted-foreground dark:border-white/[.12] ">
        {t("topicGenerator.batchList.empty")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground ">{t("topicGenerator.batchList.mySubjects")}</h2>
        <span className="text-xs text-muted-foreground ">
          {t("topicGenerator.batchList.totalCount", { count: sorted.length, plural: sorted.length > 1 ? "s" : "" })}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          placeholder={t("topicGenerator.batchList.searchPlaceholder")}
          className="min-w-[10rem] flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300"
        />
        <select
          value={brandFilter}
          onChange={(event) => {
            setBrandFilter(event.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300"
        >
          <option value="all">{t("topicGenerator.batchList.allBrands")}</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
        <select
          value={themeFilter}
          onChange={(event) => {
            setThemeFilter(event.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300"
        >
          <option value="all">{t("topicGenerator.batchList.allThemes")}</option>
          {themeOptions.map((label) => (
            <option key={label} value={label}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={contentTypeFilter}
          onChange={(event) => {
            setContentTypeFilter(event.target.value as ContentType | "all");
            setVisibleCount(PAGE_SIZE);
          }}
          className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300"
        >
          <option value="all">{t("topicGenerator.batchList.allContentTypes")}</option>
          {ALL_CONTENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {CONTENT_TYPE_LABEL[type]}
            </option>
          ))}
        </select>
        <select
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value as SortOrder)}
          className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300"
        >
          <option value="recent">{t("topicGenerator.batchList.sortRecent")}</option>
          <option value="oldest">{t("topicGenerator.batchList.sortOldest")}</option>
        </select>
      </div>

      {sorted.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-muted-foreground dark:border-white/[.12] ">
          {t("topicGenerator.batchList.noResults")}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(({ batch, brandName, themeLabel, topicCount }) => (
            <button
              key={batch.id}
              type="button"
              onClick={() => onOpen(batch.groupId ?? batch.id)}
              className="flex flex-col gap-1 rounded-lg border border-border bg-surface px-4 py-3 text-left hover:border-zinc-400 dark:hover:border-white/[.16]"
            >
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{brandName}</span>
              <span className="truncate text-xs font-medium text-violet-600 dark:text-violet-400">{themeLabel}</span>
              <span className="truncate text-xs text-muted-foreground ">{batch.name}</span>
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground ">
                <span>{t("topicGenerator.batchList.topicCount", { count: topicCount, plural: topicCount > 1 ? "s" : "" })}</span>
                <span>{batch.status === "archived" ? t("topicGenerator.batchList.archived") : t("topicGenerator.batchList.active")}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {hasMore && (
        <button
          type="button"
          onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
          className="w-fit self-center rounded-lg border border-border px-4 py-1.5 text-xs font-medium text-zinc-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
        >
          {t("topicGenerator.batchList.loadMore")}
        </button>
      )}
    </div>
  );
}
