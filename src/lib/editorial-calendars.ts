import type { BrandEditorialCalendar, EditorialDayPlan } from "@/types/editorial-calendar";

function emptyDay(day: EditorialDayPlan["day"]): EditorialDayPlan {
  return { day, enabled: false, themeIds: [], platforms: [], formats: [], frequency: 0 };
}

export const brandEditorialCalendars: BrandEditorialCalendar[] = [
  {
    brandId: "nova-cosmetics",
    weekPlans: [
      {
        id: "nova-week-standard",
        label: "Semaine type",
        days: [
          {
            day: "monday",
            enabled: true,
            themeIds: ["theme-nova-1"],
            platforms: ["instagram", "tiktok"],
            formats: ["image", "short_video"],
            frequency: 1,
          },
          {
            day: "tuesday",
            enabled: true,
            themeIds: ["theme-nova-2"],
            platforms: ["instagram"],
            formats: ["carousel", "text"],
            frequency: 1,
          },
          {
            day: "wednesday",
            enabled: true,
            themeIds: ["theme-nova-3"],
            platforms: ["instagram", "tiktok"],
            formats: ["text", "short_video"],
            frequency: 1,
          },
          {
            day: "thursday",
            enabled: true,
            themeIds: ["theme-nova-4"],
            platforms: ["tiktok", "instagram"],
            formats: ["short_video", "carousel"],
            frequency: 1,
          },
          {
            day: "friday",
            enabled: true,
            themeIds: ["theme-nova-5"],
            platforms: ["instagram"],
            formats: ["story", "image"],
            frequency: 2,
          },
          emptyDay("saturday"),
          emptyDay("sunday"),
        ],
      },
      {
        id: "nova-week-summer-sale",
        label: "Semaine soldes d'été",
        days: [
          {
            day: "monday",
            enabled: true,
            themeIds: ["theme-nova-6"],
            platforms: ["instagram", "tiktok"],
            formats: ["story"],
            frequency: 1,
          },
          {
            day: "tuesday",
            enabled: true,
            themeIds: ["theme-nova-7"],
            platforms: ["instagram"],
            formats: ["carousel"],
            frequency: 1,
          },
          {
            day: "wednesday",
            enabled: true,
            themeIds: ["theme-nova-8"],
            platforms: ["instagram", "tiktok"],
            formats: ["short_video"],
            frequency: 1,
          },
          {
            day: "thursday",
            enabled: true,
            themeIds: ["theme-nova-9"],
            platforms: ["instagram"],
            formats: ["story", "image"],
            frequency: 2,
          },
          {
            day: "friday",
            enabled: true,
            themeIds: ["theme-nova-10"],
            platforms: ["instagram", "tiktok"],
            formats: ["story", "short_video"],
            frequency: 2,
          },
          {
            day: "saturday",
            enabled: true,
            themeIds: ["theme-nova-11"],
            platforms: ["instagram"],
            formats: ["image"],
            frequency: 1,
          },
          emptyDay("sunday"),
        ],
      },
    ],
  },
  {
    brandId: "atlas-consulting",
    weekPlans: [
      {
        id: "atlas-week-standard",
        label: "Semaine type",
        days: [
          {
            day: "monday",
            enabled: true,
            themeIds: ["theme-atlas-1"],
            platforms: ["linkedin"],
            formats: ["text"],
            frequency: 1,
          },
          {
            day: "tuesday",
            enabled: true,
            themeIds: ["theme-atlas-2"],
            platforms: ["linkedin"],
            formats: ["carousel"],
            frequency: 1,
          },
          emptyDay("wednesday"),
          {
            day: "thursday",
            enabled: true,
            themeIds: ["theme-atlas-3"],
            platforms: ["linkedin", "x"],
            formats: ["text"],
            frequency: 1,
          },
          {
            day: "friday",
            enabled: true,
            themeIds: ["theme-atlas-4"],
            platforms: ["linkedin"],
            formats: ["image"],
            frequency: 1,
          },
          emptyDay("saturday"),
          emptyDay("sunday"),
        ],
      },
    ],
  },
  {
    brandId: "le-comptoir-bio",
    weekPlans: [
      {
        id: "comptoir-week-standard",
        label: "Semaine type",
        days: [
          {
            day: "monday",
            enabled: true,
            themeIds: ["theme-comptoir-1"],
            platforms: ["facebook"],
            formats: ["image"],
            frequency: 1,
          },
          emptyDay("tuesday"),
          emptyDay("wednesday"),
          emptyDay("thursday"),
          emptyDay("friday"),
          emptyDay("saturday"),
          emptyDay("sunday"),
        ],
      },
    ],
  },
];
