import { platformIcons } from "@/components/icons";
import { platformColors } from "@/lib/platform-colors";
import type { SocialPlatform } from "@/types/dashboard";
import { usePlatformLabel } from "@/lib/post-status";

const NETWORKS: SocialPlatform[] = ["instagram", "linkedin", "tiktok", "facebook", "youtube", "x"];

/** Rangée des six réseaux réellement pris en charge (voir src/lib/publishing/providers.ts) —
 * mêmes icônes/couleurs que partout ailleurs dans l'application, jamais un logo réinventé. */
export function PlatformBadgeRow({ className = "" }: { className?: string }) {
  const PLATFORM_LABEL = usePlatformLabel();
  return (
    <div className={`flex flex-wrap items-center justify-center gap-3 ${className}`}>
      {NETWORKS.map((platform) => {
        const Icon = platformIcons[platform];
        const color = platformColors[platform];
        return (
          <span
            key={platform}
            className={`flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium ${color.text}`}
          >
            <Icon className="h-4 w-4" />
            {PLATFORM_LABEL[platform]}
          </span>
        );
      })}
    </div>
  );
}
