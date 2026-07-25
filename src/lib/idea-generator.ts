import { CONTENT_FORMATS } from "@/lib/editorial-constants";
import { toISODate } from "@/lib/date-utils";
import type { SocialPlatform } from "@/types/dashboard";
import type { BrandProfile } from "@/types/brand";
import type { EditorialWeekPlan, Weekday } from "@/types/editorial-calendar";
import type { ContentIdea, IdeaSlot, PeriodType } from "@/types/idea-generator";

const JS_DAY_TO_WEEKDAY: Weekday[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const ANGLE_TEMPLATES = [
  "Astuce rapide",
  "Témoignage client",
  "Coulisses / behind-the-scenes",
  "Chiffre clé ou statistique",
  "Question à la communauté",
];

const SUBJECT_PATTERNS: Array<(theme: string, item: string) => string> = [
  (theme, item) => `${theme} autour de ${item}`,
  (theme, item) => `${theme} : ce qu'il faut savoir sur ${item}`,
  (theme, item) => `${theme} vu par nos clients à propos de ${item}`,
  (theme, item) => `${theme} — 3 idées reçues sur ${item}`,
];

const FALLBACK_CTAS = ["Découvrez-en plus", "Contactez-nous", "Partagez votre avis"];

function getWeekdayForDate(date: Date): Weekday {
  return JS_DAY_TO_WEEKDAY[date.getDay()];
}

export function getPeriodDates(periodType: PeriodType, startDate: Date): Date[] {
  if (periodType === "week") {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      return date;
    });
  }

  const year = startDate.getFullYear();
  const month = startDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
}

export function buildIdeaSlots(
  weekPlan: EditorialWeekPlan,
  dates: Date[],
  selectedPlatforms: SocialPlatform[]
): IdeaSlot[] {
  const slots: IdeaSlot[] = [];

  for (const date of dates) {
    const weekday = getWeekdayForDate(date);
    const dayPlan = weekPlan.days.find((day) => day.day === weekday);
    if (!dayPlan || !dayPlan.enabled || dayPlan.themes.length === 0) continue;

    const platforms = dayPlan.platforms.filter((platform) => selectedPlatforms.includes(platform));
    if (platforms.length === 0) continue;

    const formats = dayPlan.formats.length > 0 ? dayPlan.formats : CONTENT_FORMATS;

    for (const theme of dayPlan.themes) {
      slots.push({
        date: toISODate(date),
        day: weekday,
        themeLabel: theme.label.trim().length > 0 ? theme.label : "Thématique libre",
        themeObjective: theme.objective,
        platforms,
        formats,
      });
    }
  }

  return slots;
}

function generateIdeaFields(
  slot: IdeaSlot,
  brand: BrandProfile,
  variantSeed: number
): Omit<ContentIdea, "id" | "slot" | "variantSeed"> {
  const productItem =
    brand.productsAndServices.length > 0
      ? brand.productsAndServices[variantSeed % brand.productsAndServices.length]
      : brand.name;
  const subjectPattern = SUBJECT_PATTERNS[variantSeed % SUBJECT_PATTERNS.length];
  const ctaList = brand.preferredCtas.length > 0 ? brand.preferredCtas : FALLBACK_CTAS;

  return {
    subject: subjectPattern(slot.themeLabel, productItem),
    angle: ANGLE_TEMPLATES[variantSeed % ANGLE_TEMPLATES.length],
    objective:
      slot.themeObjective.trim().length > 0
        ? slot.themeObjective
        : "Renforcer la présence de la marque sur ce format",
    platform: slot.platforms[variantSeed % slot.platforms.length],
    format: slot.formats[variantSeed % slot.formats.length],
    cta: ctaList[variantSeed % ctaList.length],
  };
}

export function generateIdeas(
  brand: BrandProfile,
  weekPlan: EditorialWeekPlan,
  dates: Date[],
  selectedPlatforms: SocialPlatform[],
  count: number
): ContentIdea[] {
  const slots = buildIdeaSlots(weekPlan, dates, selectedPlatforms);
  if (slots.length === 0) return [];

  return Array.from({ length: count }, (_, i) => {
    const slot = slots[i % slots.length];
    const variantSeed = Math.floor(i / slots.length);
    return {
      id: `idea-${i}-${slot.date}`,
      slot,
      variantSeed,
      ...generateIdeaFields(slot, brand, variantSeed),
    };
  });
}

export function regenerateIdea(idea: ContentIdea, brand: BrandProfile): ContentIdea {
  const variantSeed = idea.variantSeed + 1;
  return { ...idea, variantSeed, ...generateIdeaFields(idea.slot, brand, variantSeed) };
}
