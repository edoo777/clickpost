import type { Weekday } from "@/types/editorial-calendar";
import type { Theme } from "@/types/theme";

export function getThemesForBrand(themes: Theme[], brandId: string): Theme[] {
  return themes.filter((theme) => theme.brandId === brandId).sort((a, b) => a.order - b.order);
}

export function getActiveThemesForWeekday(themes: Theme[], brandId: string, day: Weekday): Theme[] {
  return getThemesForBrand(themes, brandId).filter((theme) => theme.active && theme.weekdays.includes(day));
}

export function nextOrder(themes: Theme[], brandId: string): number {
  const brandThemes = getThemesForBrand(themes, brandId);
  if (brandThemes.length === 0) return 0;
  return Math.max(...brandThemes.map((theme) => theme.order)) + 1;
}
