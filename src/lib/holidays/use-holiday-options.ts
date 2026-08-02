"use client";

import { useEffect, useState } from "react";
import type { HolidayOption } from "@/types/holiday";

const countriesCache = new Map<string, HolidayOption[]>();
const regionsCache = new Map<string, HolidayOption[]>();

interface OptionsApiSuccess {
  status: "ok";
  countries: HolidayOption[];
  regions: HolidayOption[];
}

/** Options de pays/régions dérivées de date-holidays via la route serveur — jamais une liste
 * écrite à la main. Mise en cache client par pays+langue. */
export function useHolidayOptions(countryCode: string | null, locale: string) {
  const [countries, setCountries] = useState<HolidayOption[]>(() => countriesCache.get(locale) ?? []);
  const [regions, setRegions] = useState<HolidayOption[]>(() => (countryCode ? (regionsCache.get(`${countryCode}|${locale}`) ?? []) : []));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const countriesKey = locale;
    const regionsKey = countryCode ? `${countryCode}|${locale}` : null;
    const cachedCountries = countriesCache.get(countriesKey);
    const cachedRegions = regionsKey ? regionsCache.get(regionsKey) : [];

    let cancelled = false;

    if (cachedCountries && (!regionsKey || cachedRegions)) {
      const timeout = setTimeout(() => {
        if (cancelled) return;
        setCountries(cachedCountries);
        setRegions(cachedRegions ?? []);
      }, 0);
      return () => {
        cancelled = true;
        clearTimeout(timeout);
      };
    }

    const timeout = setTimeout(() => {
      void (async () => {
        setIsLoading(true);
        try {
          const params = new URLSearchParams({ locale });
          if (countryCode) params.set("countryCode", countryCode);
          const response = await fetch(`/api/calendrier/conges/options?${params.toString()}`);
          const data = (await response.json().catch(() => null)) as OptionsApiSuccess | null;
          if (cancelled || !data || data.status !== "ok") return;
          countriesCache.set(countriesKey, data.countries);
          if (regionsKey) regionsCache.set(regionsKey, data.regions);
          setCountries(data.countries);
          setRegions(data.regions);
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      })();
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [countryCode, locale]);

  return { countries, regions, isLoading };
}
