"use client";

import { useEffect, useState } from "react";
import type { HolidayEvent } from "@/types/holiday";

interface HolidaysApiSuccess {
  status: "ok";
  holidays: HolidayEvent[];
}
interface HolidaysApiError {
  status: "error";
  code: string;
  message: string;
}

/** Cache client par pays+région+année+langue — évite de recharger les mêmes congés lors d'un
 * changement de vue (mois/semaine/jour) ou d'un aller-retour sur la même période. */
const clientCache = new Map<string, HolidayEvent[]>();

function cacheKey(countryCode: string, regionCode: string | undefined, year: number, locale: string): string {
  return `${countryCode}|${regionCode ?? ""}|${year}|${locale}`;
}

interface UseHolidaysParams {
  countryCode: string | null;
  regionCode?: string | null;
  year: number;
  locale: string;
  enabled: boolean;
}

export interface UseHolidaysResult {
  holidays: HolidayEvent[];
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

export function useHolidays({ countryCode, regionCode, year, locale, enabled }: UseHolidaysParams): UseHolidaysResult {
  const [holidays, setHolidays] = useState<HolidayEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    if (!enabled || !countryCode) {
      const timeout = setTimeout(() => {
        if (cancelled) return;
        setHolidays([]);
        setError(null);
        setIsLoading(false);
      }, 0);
      return () => {
        cancelled = true;
        clearTimeout(timeout);
      };
    }

    const key = cacheKey(countryCode, regionCode ?? undefined, year, locale);
    const cached = clientCache.get(key);
    if (cached) {
      const timeout = setTimeout(() => {
        if (cancelled) return;
        setHolidays(cached);
        setError(null);
        setIsLoading(false);
      }, 0);
      return () => {
        cancelled = true;
        clearTimeout(timeout);
      };
    }

    const timeout = setTimeout(() => {
      void (async () => {
        setIsLoading(true);
        setError(null);
        try {
          const params = new URLSearchParams({ countryCode, year: String(year), locale });
          if (regionCode) params.set("regionCode", regionCode);
          const response = await fetch(`/api/calendrier/conges?${params.toString()}`);
          const data = (await response.json().catch(() => null)) as HolidaysApiSuccess | HolidaysApiError | null;
          if (cancelled) return;
          if (!data || data.status !== "ok") {
            setError(data?.message ?? "Impossible de charger les congés.");
            return;
          }
          clientCache.set(key, data.holidays);
          setHolidays(data.holidays);
        } catch {
          if (!cancelled) setError("Connexion impossible — vérifiez votre réseau.");
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      })();
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [countryCode, regionCode, year, locale, enabled, retryToken]);

  return { holidays, isLoading, error, retry: () => setRetryToken((token) => token + 1) };
}
