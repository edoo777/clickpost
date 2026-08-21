import { platformIcons } from "@/components/icons";
import { platformColors } from "@/lib/platform-colors";
import type { SocialPlatform } from "@/types/dashboard";

interface MockRow {
  title: string;
  platform: SocialPlatform;
  date: string;
  time: string;
  status: "idea" | "ready" | "scheduled" | "published";
}

const STATUS_STYLE: Record<MockRow["status"], string> = {
  idea: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  ready: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  scheduled: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
  published: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
};

interface CalendarMockupLabels {
  columnTitle: string;
  columnNetwork: string;
  columnDate: string;
  columnStatus: string;
  status: Record<MockRow["status"], string>;
  floatingIdea: string;
  floatingScript: string;
  floatingScheduled: string;
  floatingPublished: string;
  floatingEngagement: string;
  rows: { title: string; platform: SocialPlatform; date: string; time: string; status: MockRow["status"] }[];
}

/**
 * Mise en scène du calendrier/tableau ClickPost pour le hero et la section "Calendrier
 * intelligent" — reconstruite entièrement en CSS/HTML (aucune capture d'écran réelle disponible,
 * voir la consigne du mandat sur les images médiocres/non pertinentes) : les mêmes composants de
 * référence visuelle que le vrai produit (`platformIcons`, `platformColors`, badges de statut de
 * `PublicationsTable.tsx`), pour rester honnête sur ce à quoi ressemble réellement l'application,
 * jamais une maquette fantaisiste déconnectée du produit.
 */
export function CalendarMockup({ labels, className = "" }: { labels: CalendarMockupLabels; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="accent-halo overflow-hidden rounded-2xl border border-border bg-surface/90 backdrop-blur-sm">
        <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-3 text-xs font-medium text-muted-foreground">ClickPost — Calendrier éditorial</span>
        </div>

        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 border-b border-border px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:grid-cols-[2fr_1fr_1fr_1fr]">
          <span>{labels.columnTitle}</span>
          <span className="hidden text-center sm:block">{labels.columnNetwork}</span>
          <span className="hidden text-center sm:block">{labels.columnDate}</span>
          <span className="text-right sm:text-center">{labels.columnStatus}</span>
        </div>

        <div className="flex flex-col divide-y divide-border">
          {labels.rows.map((row, index) => {
            const Icon = platformIcons[row.platform];
            const color = platformColors[row.platform];
            return (
              <div
                key={`${row.title}-${index}`}
                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 px-4 py-3 sm:grid-cols-[2fr_1fr_1fr_1fr]"
              >
                <span className="truncate text-sm font-medium text-foreground">{row.title}</span>
                <span className={`hidden h-7 w-7 items-center justify-center justify-self-center rounded-lg sm:flex ${color.bg}`}>
                  <Icon className={`h-3.5 w-3.5 ${color.text}`} />
                </span>
                <span className="hidden justify-self-center text-xs text-muted-foreground sm:block">
                  {row.date} · {row.time}
                </span>
                <span className={`justify-self-end rounded-full px-2.5 py-1 text-[11px] font-medium sm:justify-self-center ${STATUS_STYLE[row.status]}`}>
                  {labels.status[row.status]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges flottants — décoratifs, masqués sur mobile pour ne jamais chevaucher le contenu. */}
      <div className="pointer-events-none absolute -left-6 top-10 hidden rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium shadow-lg lg:block marketing-float">
        💡 {labels.floatingIdea}
      </div>
      <div className="pointer-events-none absolute -right-8 top-1/3 hidden rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium shadow-lg lg:block marketing-float-delay">
        ✍️ {labels.floatingScript}
      </div>
      <div className="pointer-events-none absolute -left-8 bottom-24 hidden rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium shadow-lg lg:block marketing-float-delay">
        📅 {labels.floatingScheduled}
      </div>
      <div className="pointer-events-none absolute -right-6 bottom-8 hidden rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 shadow-lg dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 lg:block marketing-float">
        ✅ {labels.floatingPublished}
      </div>
      <div className="pointer-events-none absolute -bottom-6 left-1/3 hidden rounded-xl border border-fuchsia-200 bg-fuchsia-50 px-3 py-2 text-xs font-semibold text-fuchsia-700 shadow-lg dark:border-fuchsia-500/30 dark:bg-fuchsia-500/10 dark:text-fuchsia-400 lg:block marketing-float">
        📈 {labels.floatingEngagement}
      </div>
    </div>
  );
}
