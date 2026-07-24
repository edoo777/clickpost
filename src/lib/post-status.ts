import type { SocialPlatform } from "@/types/dashboard";
import type { PublicationStatus } from "@/types/publication";

export const STATUS_LABEL: Record<PublicationStatus, string> = {
  idea: "Idée",
  draft: "Brouillon",
  in_production: "En production",
  in_review: "En révision",
  pending_client: "En attente du client",
  approved: "Approuvé",
  scheduled: "Programmé",
  published: "Publié",
  failed: "Échec",
  rejected: "Refusée",
};

export const STATUS_STYLE: Record<PublicationStatus, string> = {
  idea: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  draft: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  in_production: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  in_review: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
  pending_client: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  approved: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400",
  scheduled: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  published: "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400",
  failed: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  rejected: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
};

export const PLATFORM_LABEL: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  x: "X",
  youtube: "YouTube",
};
