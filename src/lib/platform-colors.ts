import type { SocialPlatform } from "@/types/dashboard";

interface PlatformColor {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

export const platformColors: Record<SocialPlatform, PlatformColor> = {
  instagram: {
    bg: "bg-pink-50 dark:bg-pink-500/10",
    text: "text-pink-700 dark:text-pink-400",
    border: "border-pink-200 dark:border-pink-500/20",
    dot: "bg-pink-500",
  },
  facebook: {
    bg: "bg-blue-50 dark:bg-blue-500/10",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-500/20",
    dot: "bg-blue-500",
  },
  linkedin: {
    bg: "bg-sky-50 dark:bg-sky-500/10",
    text: "text-sky-700 dark:text-sky-400",
    border: "border-sky-200 dark:border-sky-500/20",
    dot: "bg-sky-600",
  },
  tiktok: {
    bg: "bg-teal-50 dark:bg-teal-500/10",
    text: "text-teal-700 dark:text-teal-400",
    border: "border-teal-200 dark:border-teal-500/20",
    dot: "bg-teal-500",
  },
  x: {
    bg: "bg-zinc-100 dark:bg-zinc-500/10",
    text: "text-zinc-700 dark:text-zinc-300",
    border: "border-zinc-300 dark:border-zinc-500/20",
    dot: "bg-zinc-600 dark:bg-zinc-400",
  },
  youtube: {
    bg: "bg-red-50 dark:bg-red-500/10",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-500/20",
    dot: "bg-red-600",
  },
};
