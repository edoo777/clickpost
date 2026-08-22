import { platformIcons } from "@/components/icons";
import { platformColors } from "@/lib/platform-colors";
import type { SocialPlatform } from "@/types/dashboard";

interface MockRow {
  title: string;
  brand?: string;
  hasMedia?: boolean;
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

export interface CalendarMockupLabels {
  columnTitle: string;
  columnNetwork: string;
  columnDate: string;
  columnStatus: string;
  columnBrand?: string;
  columnMedia?: string;
  status: Record<MockRow["status"], string>;
  rows: MockRow[];
}

interface CalendarMockupProps {
  labels: CalendarMockupLabels;
  className?: string;
  /** `spectacular` = variante pleine largeur pour la section "star" du site (colonnes Marque et
   * Média visibles, lignes plus grandes, une ligne "vivante" en surbrillance) — voir le mandat de
   * direction artistique, étape "Planifier" de /solution. `compact` (par défaut) reste la
   * variante utilisée dans le hero et les compositions plus petites. */
  variant?: "compact" | "spectacular";
  /** Index de la ligne à faire "pulser" doucement (voir `.marketing-row-live` dans globals.css) —
   * simule un calendrier vivant, jamais toutes les lignes en même temps. */
  liveRowIndex?: number;
}

/**
 * Mise en scène du calendrier/tableau ClickPost — reconstruite entièrement en CSS/HTML (aucune
 * capture d'écran réelle disponible) : mêmes composants de référence visuelle que le vrai produit
 * (`platformIcons`, `platformColors`), pour rester honnête sur ce à quoi ressemble réellement
 * l'application, jamais une maquette fantaisiste déconnectée du produit. Les badges flottants
 * décoratifs (ex. "24 publications planifiées") sont volontairement composés séparément par
 * chaque page (voir FloatingBadge.tsx) plutôt que codés en dur ici, pour permettre un contenu
 * différent au hero, à la section calendrier et à /solution sans dupliquer ce composant.
 */
export function CalendarMockup({ labels, className = "", variant = "compact", liveRowIndex }: CalendarMockupProps) {
  const spectacular = variant === "spectacular";
  // Variante spectaculaire : toujours 6 éléments dans le DOM (titre, marque, média, réseau, date,
  // statut), mais les colonnes marque/média/réseau/date restent visuellement masquées sous `sm`
  // ou `lg` (voir plus bas) — les pistes de grille correspondantes sont donc réduites à 0 (et
  // l'espacement retiré) en dessous de leur seuil, pour ne jamais laisser d'espace fantôme entre
  // le titre et le statut sur mobile.
  const gridCols = spectacular
    ? "grid-cols-[minmax(0,2fr)_0_0_0_0_auto] gap-x-0 sm:grid-cols-[minmax(0,2fr)_0_0_auto_auto_auto] sm:gap-x-3 lg:grid-cols-[minmax(0,2fr)_auto_auto_auto_auto_auto] lg:gap-x-4"
    : "grid-cols-[1fr_auto_auto_auto] gap-x-3 sm:grid-cols-[2fr_1fr_1fr_1fr]";

  return (
    <div className={`relative ${className}`}>
      <div
        className={`overflow-hidden rounded-2xl border backdrop-blur-sm ${
          spectacular ? "border-white/15 bg-white/[.07] shadow-2xl shadow-black/40" : "accent-halo border-border bg-surface/90"
        }`}
      >
        <div className={`flex items-center gap-2 border-b px-4 py-3 ${spectacular ? "border-white/10 bg-white/[.05]" : "border-border bg-muted/60"}`}>
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className={`ml-3 text-xs font-medium ${spectacular ? "text-white/70" : "text-muted-foreground"}`}>ClickPost — Calendrier éditorial</span>
        </div>

        <div
          className={`grid items-center border-b px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide ${gridCols} ${
            spectacular ? "border-white/10 text-white/60" : "border-border text-muted-foreground"
          }`}
        >
          <span>{labels.columnTitle}</span>
          {spectacular && <span className="hidden text-center lg:block">{labels.columnBrand}</span>}
          {spectacular && <span className="hidden text-center lg:block">{labels.columnMedia}</span>}
          <span className="hidden text-center sm:block">{labels.columnNetwork}</span>
          <span className="hidden text-center sm:block">{labels.columnDate}</span>
          <span className="text-right sm:text-center">{labels.columnStatus}</span>
        </div>

        <div className={`flex flex-col divide-y ${spectacular ? "divide-white/10" : "divide-border"}`}>
          {labels.rows.map((row, index) => {
            const Icon = platformIcons[row.platform];
            const color = platformColors[row.platform];
            const isLive = liveRowIndex === index;
            return (
              <div
                key={`${row.title}-${index}`}
                className={`grid items-center px-4 ${spectacular ? "py-4" : "py-3"} ${gridCols} ${isLive ? "marketing-row-live" : ""}`}
              >
                <span className={`truncate text-sm font-medium ${spectacular ? "text-white" : "text-foreground"}`}>{row.title}</span>
                {spectacular && (
                  <span className="hidden truncate text-center text-xs text-white/60 lg:block">{row.brand}</span>
                )}
                {spectacular && (
                  <span className="hidden justify-self-center lg:block">
                    {row.hasMedia ? (
                      <span className="flex h-7 w-9 items-center justify-center rounded-md bg-gradient-to-br from-violet-500/40 to-fuchsia-500/40">
                        <span className="h-2 w-2 rounded-full bg-white/70" />
                      </span>
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                  </span>
                )}
                <span className={`hidden h-7 w-7 items-center justify-center justify-self-center rounded-lg sm:flex ${color.bg}`}>
                  <Icon className={`h-3.5 w-3.5 ${color.text}`} />
                </span>
                <span className={`hidden justify-self-center text-xs sm:block ${spectacular ? "text-white/60" : "text-muted-foreground"}`}>
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
    </div>
  );
}
