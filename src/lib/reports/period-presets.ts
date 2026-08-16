import { toISODate } from "@/lib/date-utils";

export type ReportPeriodPreset = "this_week" | "last_week" | "this_month" | "last_month" | "30d" | "quarter" | "custom";

export const PERIOD_PRESET_LABEL: Record<ReportPeriodPreset, string> = {
  this_week: "Cette semaine",
  last_week: "Semaine précédente",
  this_month: "Ce mois",
  last_month: "Mois précédent",
  "30d": "30 derniers jours",
  quarter: "Ce trimestre",
  custom: "Période personnalisée",
};

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = (result.getDay() + 6) % 7; // lundi = début de semaine
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function computeRangeForPreset(preset: ReportPeriodPreset, today: Date): { startDate: string; endDate: string } {
  if (preset === "this_week") {
    return { startDate: toISODate(startOfWeek(today)), endDate: toISODate(today) };
  }
  if (preset === "last_week") {
    const end = new Date(startOfWeek(today));
    end.setDate(end.getDate() - 1);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    return { startDate: toISODate(start), endDate: toISODate(end) };
  }
  if (preset === "this_month") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { startDate: toISODate(start), endDate: toISODate(today) };
  }
  if (preset === "last_month") {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 0);
    return { startDate: toISODate(start), endDate: toISODate(end) };
  }
  if (preset === "quarter") {
    const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
    const start = new Date(today.getFullYear(), quarterStartMonth, 1);
    return { startDate: toISODate(start), endDate: toISODate(today) };
  }
  if (preset === "custom") {
    return { startDate: toISODate(today), endDate: toISODate(today) };
  }
  const start = new Date(today);
  start.setDate(start.getDate() - 29);
  return { startDate: toISODate(start), endDate: toISODate(today) };
}
