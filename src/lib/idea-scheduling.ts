import { WEEKDAYS } from "@/lib/editorial-constants";
import type { EditorialDayPlan, EditorialWeekPlan, Weekday } from "@/types/editorial-calendar";

export interface IdeaScheduleAssignment {
  ideaId: string;
  scheduledFor: string;
  weekday: Weekday;
  themeIds: string[];
}

export interface DistributionResult {
  assignments: IdeaScheduleAssignment[];
  unassignedIds: string[];
}

const MAX_DAYS_LOOKAHEAD = 400;
const SCHEDULE_HOUR = 9;

export function getActiveDays(weekPlan: EditorialWeekPlan): EditorialDayPlan[] {
  return weekPlan.days.filter((day) => day.enabled);
}

function weekdayAt(date: Date): Weekday {
  return WEEKDAYS[(date.getDay() + 6) % 7];
}

export function formatScheduledFor(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(SCHEDULE_HOUR)}:00`;
}

/**
 * Distribue `ids` (dans leur ordre d'origine) sur les prochains jours actifs de `weekPlan`,
 * en avançant jour par jour à partir de `startDate`. Un jour est actif si `enabled === true`.
 * Les identifiants qui ne trouvent aucun jour actif dans la fenêtre de recherche sont renvoyés
 * dans `unassignedIds` plutôt que de boucler indéfiniment (ex. calendrier sans aucun jour actif).
 */
export function distributeAcrossActiveDays(
  ids: string[],
  weekPlan: EditorialWeekPlan,
  startDate: Date
): DistributionResult {
  if (ids.length === 0) return { assignments: [], unassignedIds: [] };

  const activeByWeekday = new Map<Weekday, EditorialDayPlan>();
  weekPlan.days.forEach((day) => {
    if (day.enabled) activeByWeekday.set(day.day, day);
  });

  if (activeByWeekday.size === 0) {
    return { assignments: [], unassignedIds: [...ids] };
  }

  const assignments: IdeaScheduleAssignment[] = [];
  const remaining = [...ids];
  const cursor = new Date(startDate);
  cursor.setHours(SCHEDULE_HOUR, 0, 0, 0);

  let daysChecked = 0;
  while (remaining.length > 0 && daysChecked < MAX_DAYS_LOOKAHEAD) {
    const dayPlan = activeByWeekday.get(weekdayAt(cursor));
    if (dayPlan) {
      const ideaId = remaining.shift()!;
      assignments.push({
        ideaId,
        scheduledFor: formatScheduledFor(cursor),
        weekday: dayPlan.day,
        themeIds: dayPlan.themeIds,
      });
    }
    cursor.setDate(cursor.getDate() + 1);
    daysChecked += 1;
  }

  return { assignments, unassignedIds: remaining };
}
