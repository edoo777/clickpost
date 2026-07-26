import type { Campaign } from "@/types/campaign";

const SEED_CREATED_AT = "2026-01-01T00:00:00.000Z";

export const campaigns: Campaign[] = [
  {
    id: "campaign-nova-summer-launch",
    brandId: "nova-cosmetics",
    name: "Lancement gamme été",
    objective: "Faire connaître la nouvelle gamme solaire auprès de la communauté existante",
    startDate: "2026-06-01",
    endDate: "2026-06-30",
    active: true,
    createdAt: SEED_CREATED_AT,
  },
  {
    id: "campaign-nova-summer-sale",
    brandId: "nova-cosmetics",
    name: "Soldes d'été",
    objective: "Maximiser les ventes pendant la période de soldes",
    startDate: "2026-07-01",
    endDate: "2026-07-31",
    active: true,
    createdAt: SEED_CREATED_AT,
  },
  {
    id: "campaign-atlas-roundtable-q3",
    brandId: "atlas-consulting",
    name: "Table ronde clients Q3",
    objective: "Générer des inscriptions à l'événement trimestriel",
    startDate: "2026-07-15",
    endDate: "2026-08-15",
    active: true,
    createdAt: SEED_CREATED_AT,
  },
];
