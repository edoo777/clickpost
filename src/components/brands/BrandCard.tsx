import Link from "next/link";
import { CompletenessBar } from "@/components/brands/CompletenessBar";
import { platformIcons } from "@/components/icons";
import { getBrandCompleteness } from "@/lib/brand-completeness";
import { platformColors } from "@/lib/platform-colors";
import type { Brand } from "@/types/brand";

interface BrandCardProps {
  brand: Brand;
  isActive: boolean;
}

export function BrandCard({ brand, isActive }: BrandCardProps) {
  const { percent } = getBrandCompleteness(brand);
  const isArchived = brand.status === "archived";

  return (
    <Link
      href={`/marques/${brand.id}`}
      className={`flex flex-col gap-4 rounded-xl border bg-surface p-5 transition-colors hover:border-zinc-400 dark:hover:border-white/[.16] ${
        isActive ? "border-violet-400 dark:border-violet-500/50" : "border-border"
      } ${isArchived ? "opacity-70" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-foreground ">{brand.name}</h2>
          <p className="text-sm text-muted-foreground ">{brand.industry || "Secteur non renseigné"}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {isActive && (
            <span className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-2 py-0.5 text-[11px] font-semibold text-white">
              Marque active
            </span>
          )}
          {isArchived && (
            <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              Archivée
            </span>
          )}
        </div>
      </div>

      <CompletenessBar percent={percent} />

      <div className="flex items-center gap-2">
        {brand.socialPlatforms.map((platform) => {
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
        {brand.socialPlatforms.length === 0 && (
          <span className="text-xs text-muted-foreground ">Aucun réseau associé</span>
        )}
      </div>
    </Link>
  );
}
