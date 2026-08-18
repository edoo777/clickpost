"use client";

import { useEffect, useRef, useState } from "react";
import type { DisplayableTrend } from "@/components/trends/displayable-trend";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type { SocialPlatform } from "@/types/dashboard";
import { fetchWebSearchStatus, runWebTrendSearch } from "@/lib/trends/client";
import { musicItemToDisplayable, webTrendItemToDisplayable } from "@/lib/trends/display-mappers";
import type { MusicTrendItem, TrendItem } from "@/types/trend";

type TriggerStatus = "checking" | "ready" | "loading" | "quota_blocked" | "error";

export interface WebSearchTriggerParams {
  mode: "global" | "targeted";
  focus: "platform_trends" | "music";
  platform?: SocialPlatform;
  platforms?: SocialPlatform[];
  niche?: string;
  themeLabels?: string[];
  country?: string;
  language?: string;
  period: "24h" | "7d" | "30d" | "all";
}

type TFunction = ReturnType<typeof useTranslations>;

function formatResetAt(t: TFunction, resetAt: string): string {
  const date = new Date(resetAt);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = date.getTime() - Date.now();
  if (diffMs <= 0) return t("trends.searchTrigger.resetSoon");
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 60) return t("trends.searchTrigger.resetInMinutes", { minutes });
  const hours = Math.round(minutes / 60);
  return t("trends.searchTrigger.resetInHours", { hours });
}

/**
 * Bouton « Rechercher les tendances » / « Rechercher de nouveau » — SEUL point d'entrée vers la
 * veille Web (jamais appelée automatiquement, ni au chargement ni sur changement de filtre). Un
 * appel de statut (GET, sans consommation) précède l'affichage pour indiquer honnêtement si le
 * quota est déjà épuisé, sans jamais bloquer la consultation du cache déjà affiché par ailleurs.
 */
export function WebSearchTrigger({
  params,
  label,
  retryLabel,
  onResults,
}: {
  params: WebSearchTriggerParams;
  label?: string;
  retryLabel?: string;
  onResults: (items: DisplayableTrend[]) => void;
}) {
  const t = useTranslations();
  const resolvedLabel = label ?? t("trends.searchTrigger.defaultLabel");
  const resolvedRetryLabel = retryLabel ?? t("trends.searchTrigger.retryLabel");
  const [status, setStatus] = useState<TriggerStatus>("checking");
  const [resetAt, setResetAt] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [hasSearchedOnce, setHasSearchedOnce] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const platformsKey = params.platforms ? params.platforms.join(",") : "";

  useEffect(() => {
    const mode = params.mode;
    const focus = params.focus;
    const platform = params.platform;
    const platforms = params.platforms;
    const niche = params.niche;
    const themeLabels = params.themeLabels;
    const country = params.country;
    const language = params.language;
    const period = params.period;

    const timeout = setTimeout(async () => {
      const result = await fetchWebSearchStatus({ mode, focus, platform, platforms, niche, themeLabels, country, language, period });
      if (!isMountedRef.current) return;
      if (result.status === "ok" && result.quota) {
        if (mode === "global") {
          if (result.quota.global.remaining <= 0) {
            setStatus("quota_blocked");
            setResetAt(result.quota.global.resetAt);
            return;
          }
        } else {
          const blockedByWorkspace = result.quota.targetedWorkspace.remaining <= 0;
          const blockedByUser = result.quota.targetedUser.remaining <= 0;
          if (blockedByWorkspace || blockedByUser) {
            setStatus("quota_blocked");
            setResetAt(blockedByWorkspace ? result.quota.targetedWorkspace.resetAt : result.quota.targetedUser.resetAt);
            return;
          }
        }
      }
      setStatus("ready");
    }, 0);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- themeLabels est un tableau recréé à chaque rendu ; platformsKey (chaîne stable) le représente déjà pour la comparaison de dépendances.
  }, [params.mode, params.focus, params.platform, platformsKey, params.niche, params.country, params.language, params.period]);

  async function handleClick() {
    setStatus("loading");
    setMessage(null);
    const result = await runWebTrendSearch({
      mode: params.mode,
      focus: params.focus,
      platform: params.platform,
      platforms: params.platforms,
      niche: params.niche,
      themeLabels: params.themeLabels,
      country: params.country,
      language: params.language,
      period: params.period,
    });
    if (!isMountedRef.current) return;

    if ("resetAt" in result) {
      setStatus("quota_blocked");
      setResetAt(result.resetAt);
      setMessage(result.message);
      return;
    }
    if (result.status !== "ok") {
      setStatus("error");
      setMessage(result.message ?? t("trends.searchTrigger.searchUnavailable"));
      return;
    }

    setHasSearchedOnce(true);
    setStatus("ready");
    const items =
      params.focus === "music"
        ? (result.items as MusicTrendItem[]).map(musicItemToDisplayable)
        : (result.items as TrendItem[]).map(webTrendItemToDisplayable);
    onResults(items);
  }

  const isDisabled = status === "checking" || status === "loading" || status === "quota_blocked";
  const buttonLabel = status === "loading" ? t("trends.searchTrigger.searching") : hasSearchedOnce ? resolvedRetryLabel : resolvedLabel;

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className="w-fit rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
      >
        {status === "quota_blocked"
          ? t("trends.searchTrigger.nextSearchAvailable", { when: resetAt ? formatResetAt(t, resetAt) : "" })
          : buttonLabel}
      </button>
      {message && <p className="text-[11px] text-muted-foreground">{message}</p>}
    </div>
  );
}
