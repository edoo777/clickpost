import Link from "next/link";
import { platformIcons } from "@/components/icons";
import { platformColors } from "@/lib/platform-colors";
import type { PublicationPerformance } from "@/types/analytics";
import type { Publication } from "@/types/publication";

interface TopPublicationsListProps {
  publications: Array<Publication & { performance: PublicationPerformance; engagementRate: number }>;
  title?: string;
}

export function TopPublicationsList({ publications, title = "Meilleures publications" }: TopPublicationsListProps) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5  ">
      <h2 className="text-sm font-semibold text-foreground ">{title}</h2>
      {publications.length === 0 ? (
        <p className="text-sm text-muted-foreground ">Pas assez de données sur cette période.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border ">
          {publications.map((publication) => {
            const Icon = platformIcons[publication.platform];
            const color = platformColors[publication.platform];
            return (
              <li key={publication.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${color.bg}`}>
                  <Icon className={`h-4 w-4 ${color.text}`} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <Link
                    href={`/publications/${publication.id}`}
                    className="truncate text-sm font-medium text-foreground hover:underline "
                  >
                    {publication.excerpt || "Sans titre"}
                  </Link>
                  <span className="truncate text-xs text-muted-foreground ">
                    {publication.brand} · {publication.performance.impressions.toLocaleString("fr-FR")} impressions
                    {publication.performance.source === "demo" ? " · démonstration" : ""}
                  </span>
                </div>
                <span className="shrink-0 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  {publication.engagementRate.toFixed(1)}%
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
