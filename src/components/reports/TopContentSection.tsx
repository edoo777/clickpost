import { PLATFORM_LABEL } from "@/lib/post-status";
import type { SocialPlatform } from "@/types/dashboard";
import type { ReportPublicationSummary } from "@/types/report";

function PublicationList({ title, publications }: { title: string; publications: ReportPublicationSummary[] }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {publications.length === 0 ? (
        <p className="text-sm text-muted-foreground">Pas assez de données sur cette période.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {publications.map((publication) => (
            <li key={publication.id} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-foreground">{publication.excerpt || "Sans titre"}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {PLATFORM_LABEL[publication.platform as SocialPlatform] ?? publication.platform} · {publication.scheduledFor.slice(0, 10)}
                  {publication.source === "demo" ? " · démonstration" : ""}
                </span>
              </div>
              <span className="shrink-0 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {publication.engagementRate.toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function TopContentSection({ top, worst }: { top: ReportPublicationSummary[]; worst: ReportPublicationSummary[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <PublicationList title="Meilleures publications" publications={top} />
      <PublicationList title="Publications les moins performantes" publications={worst} />
    </div>
  );
}
