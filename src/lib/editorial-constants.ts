import { useMemo } from "react";
import { useTranslations, type TranslationKey } from "@/lib/i18n/locale-provider";
import type { ContentFormat, Weekday } from "@/types/editorial-calendar";

export const WEEKDAYS: Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const WEEKDAY_LABEL: Record<Weekday, string> = {
  monday: "Lundi",
  tuesday: "Mardi",
  wednesday: "Mercredi",
  thursday: "Jeudi",
  friday: "Vendredi",
  saturday: "Samedi",
  sunday: "Dimanche",
};

export const CONTENT_FORMATS: ContentFormat[] = ["text", "carousel", "image", "short_video", "story"];

export const FORMAT_LABEL: Record<ContentFormat, string> = {
  text: "Texte",
  carousel: "Carrousel",
  image: "Image",
  short_video: "Vidéo courte",
  story: "Story",
  article: "Article ou contenu long",
};

const WEEKDAY_LABEL_KEY: Record<Weekday, TranslationKey> = {
  monday: "weekday.monday",
  tuesday: "weekday.tuesday",
  wednesday: "weekday.wednesday",
  thursday: "weekday.thursday",
  friday: "weekday.friday",
  saturday: "weekday.saturday",
  sunday: "weekday.sunday",
};

const FORMAT_LABEL_KEY: Record<ContentFormat, TranslationKey> = {
  text: "format.text",
  carousel: "format.carousel",
  image: "format.image",
  short_video: "format.short_video",
  story: "format.story",
  article: "format.article",
};

/** Version traduite de `WEEKDAY_LABEL`, réservée aux composants React. `WEEKDAY_LABEL` (français
 * statique) reste utile tel quel pour tout code non-composant. */
export function useWeekdayLabel(): Record<Weekday, string> {
  const t = useTranslations();
  return useMemo(() => {
    const entries = Object.entries(WEEKDAY_LABEL_KEY) as [Weekday, TranslationKey][];
    return Object.fromEntries(entries.map(([day, key]) => [day, t(key)])) as Record<Weekday, string>;
  }, [t]);
}

/** Version traduite de `FORMAT_LABEL` — voir le commentaire de `useWeekdayLabel`. */
export function useFormatLabel(): Record<ContentFormat, string> {
  const t = useTranslations();
  return useMemo(() => {
    const entries = Object.entries(FORMAT_LABEL_KEY) as [ContentFormat, TranslationKey][];
    return Object.fromEntries(entries.map(([format, key]) => [format, t(key)])) as Record<ContentFormat, string>;
  }, [t]);
}
