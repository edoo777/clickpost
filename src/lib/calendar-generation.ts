import { WEEKDAYS } from "@/lib/editorial-constants";
import { formatScheduledFor } from "@/lib/idea-scheduling";
import { generateTopicLabels, normalizeTopicLabel } from "@/lib/topic-generator";
import type { BrandProfile } from "@/types/brand";
import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat, EditorialDayPlan, EditorialWeekPlan, Weekday } from "@/types/editorial-calendar";
import type { Theme } from "@/types/theme";

export interface DayOccurrence {
  date: Date;
  weekday: Weekday;
  dayPlan: EditorialDayPlan;
}

function weekdayAt(date: Date): Weekday {
  return WEEKDAYS[(date.getDay() + 6) % 7];
}

/**
 * Parcourt `weekCount` semaines à partir de `startDate` et ne garde que les occurrences de
 * jours actifs avec une fréquence de publication strictement positive (un jour activé à
 * fréquence 0 ne produit rien, cohérent avec le sens du champ).
 */
export function computeActiveDayOccurrences(
  weekPlan: EditorialWeekPlan,
  startDate: Date,
  weekCount: number
): DayOccurrence[] {
  const byWeekday = new Map<Weekday, EditorialDayPlan>();
  weekPlan.days.forEach((day) => {
    if (day.enabled && day.frequency > 0) byWeekday.set(day.day, day);
  });
  if (byWeekday.size === 0) return [];

  const occurrences: DayOccurrence[] = [];
  const cursor = new Date(startDate);
  cursor.setHours(0, 0, 0, 0);

  for (let i = 0; i < weekCount * 7; i++) {
    const weekday = weekdayAt(cursor);
    const dayPlan = byWeekday.get(weekday);
    if (dayPlan) occurrences.push({ date: new Date(cursor), weekday, dayPlan });
    cursor.setDate(cursor.getDate() + 1);
  }

  return occurrences;
}

export interface CalendarGeneratedIdeaPreview {
  id: string;
  scheduledFor: string;
  weekday: Weekday;
  themeId?: string;
  themeLabel: string;
  platform: SocialPlatform;
  format: ContentFormat;
  title: string;
  isDuplicate: boolean;
}

export interface GenerateIdeasFromCalendarParams {
  weekPlan: EditorialWeekPlan;
  startDate: Date;
  weekCount: number;
  themes: Theme[];
  brand: BrandProfile;
}

/**
 * Génère, pour chaque occurrence de jour actif du plan sur la période demandée, `frequency`
 * libellés déterministes (via `generateTopicLabels`, D2), en faisant tourner les réseaux/formats
 * définis pour ce jour. `round` avance à chaque occurrence pour garantir la variété sur toute la
 * période sans jamais répéter la même combinaison gabarit/élément.
 */
export function generateIdeasFromCalendar(params: GenerateIdeasFromCalendarParams): CalendarGeneratedIdeaPreview[] {
  const { weekPlan, startDate, weekCount, themes, brand } = params;
  const occurrences = computeActiveDayOccurrences(weekPlan, startDate, weekCount);
  const items = brand.productsAndServices.length > 0 ? brand.productsAndServices : [brand.name];
  const seenLabels = new Set<string>();
  const previews: CalendarGeneratedIdeaPreview[] = [];

  occurrences.forEach((occurrence, round) => {
    const theme = occurrence.dayPlan.themeIds
      .map((id) => themes.find((candidate) => candidate.id === id))
      .find((candidate): candidate is Theme => Boolean(candidate));
    const themeLabel = theme?.label ?? brand.name;

    const labels = generateTopicLabels({ themeLabel, items, varietyLevel: "medium" }, occurrence.dayPlan.frequency, round);

    labels.forEach((title, index) => {
      const platform =
        occurrence.dayPlan.platforms.length > 0
          ? occurrence.dayPlan.platforms[index % occurrence.dayPlan.platforms.length]
          : brand.socialPlatforms[0] ?? "instagram";
      const format: ContentFormat =
        occurrence.dayPlan.formats.length > 0
          ? occurrence.dayPlan.formats[index % occurrence.dayPlan.formats.length]
          : "text";

      const normalized = normalizeTopicLabel(title);
      const isDuplicate = seenLabels.has(normalized);
      seenLabels.add(normalized);

      previews.push({
        id: crypto.randomUUID(),
        scheduledFor: formatScheduledFor(occurrence.date),
        weekday: occurrence.weekday,
        themeId: theme?.id,
        themeLabel,
        platform,
        format,
        title,
        isDuplicate,
      });
    });
  });

  return previews;
}
