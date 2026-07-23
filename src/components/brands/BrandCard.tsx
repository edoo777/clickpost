import Link from "next/link";
import { CompletenessBar } from "@/components/brands/CompletenessBar";
import { platformIcons } from "@/components/icons";
import { getBrandCompleteness } from "@/lib/brand-completeness";
import { platformColors } from "@/lib/platform-colors";
import type { BrandProfile } from "@/types/brand";

interface BrandCardProps {
  profile: BrandProfile;
}

export function BrandCard({ profile }: BrandCardProps) {
  const { percent } = getBrandCompleteness(profile);

  return (
    <Link
      href={`/marques/${profile.id}`}
      className="flex flex-col gap-4 rounded-xl border border-black/[.08] bg-white p-5 transition-colors hover:border-black/[.16] dark:border-white/[.08] dark:bg-zinc-950 dark:hover:border-white/[.16]"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">{profile.name}</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{profile.industry}</p>
      </div>

      <CompletenessBar percent={percent} />

      <div className="flex items-center gap-2">
        {profile.socialPlatforms.map((platform) => {
          const Icon = platformIcons[platform];
          const color = platformColors[platform];
          return (
            <span
              key={platform}
              className={`flex h-7 w-7 items-center justify-center rounded-full ${color.bg}`}
            >
              <Icon className={`h-3.5 w-3.5 ${color.text}`} />
            </span>
          );
        })}
      </div>
    </Link>
  );
}
