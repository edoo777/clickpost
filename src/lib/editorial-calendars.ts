import type { BrandEditorialCalendar, EditorialDayPlan } from "@/types/editorial-calendar";

function emptyDay(day: EditorialDayPlan["day"]): EditorialDayPlan {
  return { day, enabled: false, themes: [], platforms: [], formats: [], frequency: 0 };
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
            themes: [
              {
                id: "nova-mon-1",
                label: "Conseils pratiques",
                objective: "Créer de la proximité et de l'utilité perçue au quotidien",
              },
            ],
            platforms: ["instagram", "tiktok"],
            formats: ["image", "short_video"],
            frequency: 1,
          },
          {
            day: "tuesday",
            enabled: true,
            themes: [
              {
                id: "nova-tue-1",
                label: "Contenu éducatif",
                objective: "Renforcer l'expertise perçue sur les ingrédients et la formulation",
              },
            ],
            platforms: ["instagram"],
            formats: ["carousel", "text"],
            frequency: 1,
          },
          {
            day: "wednesday",
            enabled: true,
            themes: [
              {
                id: "nova-wed-1",
                label: "Opinion ou expertise",
                objective: "Humaniser la marque à travers un point de vue assumé",
              },
            ],
            platforms: ["instagram", "tiktok"],
            formats: ["text", "short_video"],
            frequency: 1,
          },
          {
            day: "thursday",
            enabled: true,
            themes: [
              {
                id: "nova-thu-1",
                label: "Démonstration ou étude de cas",
                objective: "Prouver l'efficacité produit par la preuve sociale",
              },
            ],
            platforms: ["tiktok", "instagram"],
            formats: ["short_video", "carousel"],
            frequency: 1,
          },
          {
            day: "friday",
            enabled: true,
            themes: [
              {
                id: "nova-fri-1",
                label: "Offre et appel à l'action",
                objective: "Générer des ventes directes sur la gamme du moment",
              },
            ],
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
            themes: [{ id: "nova-sale-mon-1", label: "Teasing soldes", objective: "Créer de l'attente avant le lancement" }],
            platforms: ["instagram", "tiktok"],
            formats: ["story"],
            frequency: 1,
          },
          {
            day: "tuesday",
            enabled: true,
            themes: [
              {
                id: "nova-sale-tue-1",
                label: "Focus produit soldé",
                objective: "Mettre en avant un produit phare en promotion",
              },
            ],
            platforms: ["instagram"],
            formats: ["carousel"],
            frequency: 1,
          },
          {
            day: "wednesday",
            enabled: true,
            themes: [
              { id: "nova-sale-wed-1", label: "Témoignage client", objective: "Rassurer via la preuve sociale" },
            ],
            platforms: ["instagram", "tiktok"],
            formats: ["short_video"],
            frequency: 1,
          },
          {
            day: "thursday",
            enabled: true,
            themes: [{ id: "nova-sale-thu-1", label: "Compte à rebours", objective: "Créer de l'urgence avant la fin des soldes" }],
            platforms: ["instagram"],
            formats: ["story", "image"],
            frequency: 2,
          },
          {
            day: "friday",
            enabled: true,
            themes: [
              {
                id: "nova-sale-fri-1",
                label: "Dernier jour de soldes",
                objective: "Maximiser les ventes sur la dernière ligne droite",
              },
            ],
            platforms: ["instagram", "tiktok"],
            formats: ["story", "short_video"],
            frequency: 2,
          },
          {
            day: "saturday",
            enabled: true,
            themes: [{ id: "nova-sale-sat-1", label: "Bilan des soldes", objective: "Remercier la communauté" }],
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
            themes: [
              { id: "atlas-mon-1", label: "Actualité du secteur", objective: "Positionner le cabinet en veille active" },
            ],
            platforms: ["linkedin"],
            formats: ["text"],
            frequency: 1,
          },
          {
            day: "tuesday",
            enabled: true,
            themes: [
              {
                id: "atlas-tue-1",
                label: "Étude de cas client",
                objective: "Démontrer la valeur ajoutée du conseil sur un cas concret",
              },
            ],
            platforms: ["linkedin"],
            formats: ["carousel"],
            frequency: 1,
          },
          emptyDay("wednesday"),
          {
            day: "thursday",
            enabled: true,
            themes: [
              { id: "atlas-thu-1", label: "Point de vue d'expert", objective: "Asseoir la crédibilité des consultants" },
            ],
            platforms: ["linkedin", "x"],
            formats: ["text"],
            frequency: 1,
          },
          {
            day: "friday",
            enabled: true,
            themes: [
              {
                id: "atlas-fri-1",
                label: "Recrutement / vie du cabinet",
                objective: "Attirer des talents et humaniser la marque",
              },
            ],
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
            themes: [{ id: "comptoir-mon-1", label: "Produit du moment", objective: "" }],
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
