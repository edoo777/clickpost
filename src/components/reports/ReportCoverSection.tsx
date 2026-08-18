"use client";

import { usePlatformLabel } from "@/lib/post-status";
import type { SocialPlatform } from "@/types/dashboard";
import type { ReportCoverMeta, ReportType } from "@/types/report";

const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  internal: "Rapport interne",
  client: "Rapport client",
  executive: "Rapport exécutif",
};

/** Page de couverture — jamais générée par Claude, uniquement des données réelles (marque,
 * workspace, profil de la personne qui génère). Toujours la première section affichée. */
export function ReportCoverSection({ cover }: { cover: ReportCoverMeta }) {
  const PLATFORM_LABEL = usePlatformLabel();
  const platformsLabel =
    cover.platforms.length === 0
      ? "Toutes les plateformes"
      : cover.platforms.map((platform) => PLATFORM_LABEL[platform as SocialPlatform] ?? platform).join(", ");

  return (
    <section className="flex flex-col gap-5 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 p-8 text-white">
      <span className="w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em]">
        {REPORT_TYPE_LABEL[cover.reportType]}
      </span>
      <div className="flex items-center gap-4">
        {cover.brandLogoUrl && (
          <img src={cover.brandLogoUrl} alt="" className="h-14 w-14 shrink-0 rounded-xl bg-white/10 object-contain p-1.5" />
        )}
        <h1 className="text-3xl font-semibold tracking-tight">{cover.brandName}</h1>
      </div>
      <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-white/60">Période</dt>
          <dd className="font-medium">
            {cover.periodStart} → {cover.periodEnd}
          </dd>
        </div>
        <div>
          <dt className="text-white/60">Plateformes</dt>
          <dd className="font-medium">{platformsLabel}</dd>
        </div>
        <div>
          <dt className="text-white/60">Préparé par</dt>
          <dd className="font-medium">
            {cover.generatedByName ? `${cover.generatedByName} · ` : ""}
            {cover.workspaceName}
          </dd>
        </div>
      </dl>
      <span className="text-xs text-white/60">
        Généré le{" "}
        {new Date(cover.generatedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
      </span>
    </section>
  );
}
