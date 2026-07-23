import type { PerformanceMetric, ScheduledPost, SocialAccount } from "@/types/dashboard";

export const performanceMetrics: PerformanceMetric[] = [
  { id: "impressions", label: "Impressions", value: "128 400", change: 12.4 },
  { id: "engagement", label: "Taux d'engagement", value: "4.8%", change: 1.6 },
  { id: "followers", label: "Nouveaux abonnés", value: "1 042", change: 8.1 },
  { id: "clicks", label: "Clics sur les liens", value: "3 210", change: -2.3 },
];

export const upcomingPosts: ScheduledPost[] = [
  {
    id: "post-1",
    platform: "instagram",
    brand: "Nova Cosmetics",
    excerpt: "Lancement de la nouvelle gamme été",
    scheduledFor: "2026-07-24T09:00:00",
    status: "scheduled",
  },
  {
    id: "post-2",
    platform: "linkedin",
    brand: "Atlas Consulting",
    excerpt: "Étude de cas : transformation digitale d'un client retail",
    scheduledFor: "2026-07-24T14:30:00",
    status: "pending_approval",
  },
  {
    id: "post-3",
    platform: "tiktok",
    brand: "Nova Cosmetics",
    excerpt: "Routine skincare en 15 secondes",
    scheduledFor: "2026-07-26T11:00:00",
    status: "draft",
  },
  {
    id: "post-4",
    platform: "facebook",
    brand: "Le Comptoir Bio",
    excerpt: "Recette de saison avec nos produits locaux",
    scheduledFor: "2026-07-27T17:00:00",
    status: "scheduled",
  },
  {
    id: "post-5",
    platform: "x",
    brand: "Atlas Consulting",
    excerpt: "Thread : 5 tendances marketing pour 2026",
    scheduledFor: "2026-07-29T08:30:00",
    status: "scheduled",
  },
];

export const connectedAccounts: SocialAccount[] = [
  { id: "acc-1", platform: "instagram", brand: "Nova Cosmetics", handle: "@novacosmetics", status: "connected" },
  { id: "acc-2", platform: "facebook", brand: "Le Comptoir Bio", handle: "Le Comptoir Bio", status: "connected" },
  { id: "acc-3", platform: "linkedin", brand: "Atlas Consulting", handle: "Atlas Consulting", status: "connected" },
  { id: "acc-4", platform: "tiktok", brand: "Nova Cosmetics", handle: "@novacosmetics", status: "reconnect_needed" },
  { id: "acc-5", platform: "x", brand: "Atlas Consulting", handle: "@atlasconsulting", status: "connected" },
];
