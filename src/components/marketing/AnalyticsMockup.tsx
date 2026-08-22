import { IconArrowUp } from "@/components/icons";

export interface AnalyticsMetric {
  label: string;
  value: string;
  changeLabel: string;
}

const BARS = [40, 65, 50, 80, 60, 95, 70];

/** Reconstruction CSS d'un tableau de bord analytics — étape "Mesurer" de /solution. Valeurs
 * illustratives non attribuées à un vrai compte (jamais présentées comme des statistiques réelles
 * d'un utilisateur) — un mockup d'interface, pas une capture de données. */
export function AnalyticsMockup({ metrics, bestContentLabel, className = "" }: { metrics: AnalyticsMetric[]; bestContentLabel: string; className?: string }) {
  return (
    <div className={`accent-halo flex flex-col gap-5 rounded-2xl border border-border bg-surface p-5 ${className}`}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex flex-col gap-1 rounded-xl bg-muted/50 p-3">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{metric.label}</span>
            <span className="text-lg font-semibold tracking-tight">{metric.value}</span>
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <IconArrowUp className="h-3 w-3" />
              {metric.changeLabel}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-end gap-2 rounded-xl bg-muted/30 p-4" aria-hidden="true">
        {BARS.map((height, index) => (
          <div key={index} className="flex-1 rounded-t-md bg-gradient-to-t from-violet-600 to-fuchsia-500" style={{ height: `${height}px` }} />
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{bestContentLabel}</span>
        {[1, 2, 3].map((row) => (
          <div key={row} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
            <div className="h-2 flex-1 rounded-full bg-muted" style={{ maxWidth: `${90 - row * 15}%` }} />
            <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400">#{row}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
