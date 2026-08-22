import { IconLogoMark } from "@/components/icons";
import { platformIcons } from "@/components/icons";
import { platformColors } from "@/lib/platform-colors";
import type { SocialPlatform } from "@/types/dashboard";
import { usePlatformLabel } from "@/lib/post-status";

const NETWORKS: SocialPlatform[] = ["instagram", "linkedin", "tiktok", "facebook", "youtube", "x"];

/** Reconstruction CSS du flux de publication — ClickPost au centre, branché vers les six réseaux
 * réellement pris en charge (voir src/lib/publishing/providers.ts). Utilisée par l'étape
 * "Publier" de /solution et par la section multi-réseaux de l'accueil. */
export function PublishFlowMockup({ className = "" }: { className?: string }) {
  const PLATFORM_LABEL = usePlatformLabel();

  return (
    <div className={`flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-4 ${className}`}>
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-fuchsia-500/25">
        <IconLogoMark className="h-8 w-8 text-white" />
      </span>

      <div className="hidden h-px w-10 shrink-0 bg-gradient-to-r from-violet-400 to-transparent sm:block" aria-hidden="true" />

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {NETWORKS.map((platform) => {
          const Icon = platformIcons[platform];
          const color = platformColors[platform];
          return (
            <div
              key={platform}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-3 transition-transform duration-300 hover:-translate-y-1 hover:border-violet-300 dark:hover:border-violet-500/40"
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${color.bg}`}>
                <Icon className={`h-4.5 w-4.5 ${color.text}`} />
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">{PLATFORM_LABEL[platform]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
