import type { PostStatus, SocialPlatform } from "@/types/dashboard";

export const STATUS_LABEL: Record<PostStatus, string> = {
  scheduled: "Planifié",
  draft: "Brouillon",
  pending_approval: "En attente d'approbation",
};

export const STATUS_STYLE: Record<PostStatus, string> = {
  scheduled: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  draft: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  pending_approval: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
};

export const PLATFORM_LABEL: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  x: "X",
};
