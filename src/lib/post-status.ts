import { useMemo } from "react";
import { useTranslations, type TranslationKey } from "@/lib/i18n/locale-provider";
import type { SocialPlatform } from "@/types/dashboard";
import type { PublicationStatus } from "@/types/publication";

export const STATUS_LABEL: Record<PublicationStatus, string> = {
  idea: "Idée",
  to_develop: "À développer",
  content_generated: "Contenu généré",
  draft: "Brouillon",
  in_production: "En production",
  in_review: "En révision",
  needs_changes: "Modifications demandées",
  pending_client: "En attente du client",
  approved: "Approuvé",
  ready_to_schedule: "Prêt à programmer",
  scheduled: "Programmé",
  publishing: "Publication en cours",
  published: "Publié",
  failed: "Échec",
  rejected: "Refusée",
  archived: "Archivée",
};

export const STATUS_STYLE: Record<PublicationStatus, string> = {
  idea: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  to_develop: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
  content_generated: "bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-500/10 dark:text-fuchsia-400",
  draft: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  in_production: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  in_review: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
  needs_changes: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",
  pending_client: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  approved: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400",
  ready_to_schedule: "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400",
  scheduled: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  publishing: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  published: "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400",
  failed: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  rejected: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  archived: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-500",
};

export const PLATFORM_LABEL: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  x: "X",
  youtube: "YouTube",
  threads: "Threads",
  pinterest: "Pinterest",
  other: "Autre",
};

const STATUS_LABEL_KEY: Record<PublicationStatus, TranslationKey> = {
  idea: "status.publication.idea",
  to_develop: "status.publication.to_develop",
  content_generated: "status.publication.content_generated",
  draft: "status.publication.draft",
  in_production: "status.publication.in_production",
  in_review: "status.publication.in_review",
  needs_changes: "status.publication.needs_changes",
  pending_client: "status.publication.pending_client",
  approved: "status.publication.approved",
  ready_to_schedule: "status.publication.ready_to_schedule",
  scheduled: "status.publication.scheduled",
  publishing: "status.publication.publishing",
  published: "status.publication.published",
  failed: "status.publication.failed",
  rejected: "status.publication.rejected",
  archived: "status.publication.archived",
};

const PLATFORM_LABEL_KEY: Record<SocialPlatform, TranslationKey> = {
  instagram: "platform.instagram",
  facebook: "platform.facebook",
  linkedin: "platform.linkedin",
  tiktok: "platform.tiktok",
  x: "platform.x",
  youtube: "platform.youtube",
  threads: "platform.threads",
  pinterest: "platform.pinterest",
  other: "platform.other",
};

/** Version traduite de `STATUS_LABEL`, réservée aux composants React (utilise `useTranslations`).
 * `STATUS_LABEL` (français statique) reste nécessaire tel quel pour le code non-composant qui
 * construit des prompts IA ou du texte de rapport (jamais un hook dans une fonction pure). */
export function useStatusLabel(): Record<PublicationStatus, string> {
  const t = useTranslations();
  return useMemo(() => {
    const entries = Object.entries(STATUS_LABEL_KEY) as [PublicationStatus, TranslationKey][];
    return Object.fromEntries(entries.map(([status, key]) => [status, t(key)])) as Record<PublicationStatus, string>;
  }, [t]);
}

/** Version traduite de `PLATFORM_LABEL` — voir le commentaire de `useStatusLabel`. */
export function usePlatformLabel(): Record<SocialPlatform, string> {
  const t = useTranslations();
  return useMemo(() => {
    const entries = Object.entries(PLATFORM_LABEL_KEY) as [SocialPlatform, TranslationKey][];
    return Object.fromEntries(entries.map(([platform, key]) => [platform, t(key)])) as Record<SocialPlatform, string>;
  }, [t]);
}
