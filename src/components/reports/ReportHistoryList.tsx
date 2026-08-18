"use client";

import { useTranslations } from "@/lib/i18n/locale-provider";
import { usePlatformLabel } from "@/lib/post-status";
import type { SocialPlatform } from "@/types/dashboard";
import type { Report, ReportStatus, ReportType } from "@/types/report";

function formatPlatforms(platform: string, platformLabel: Record<SocialPlatform, string>, allPlatformsLabel: string): string {
  if (platform === "all" || platform === "") return allPlatformsLabel;
  return platform
    .split(",")
    .map((value) => platformLabel[value as SocialPlatform] ?? value)
    .join(", ");
}

export function ReportHistoryList({ reports, onOpen }: { reports: Report[]; onOpen: (report: Report) => void }) {
  const t = useTranslations();
  const PLATFORM_LABEL = usePlatformLabel();
  const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
    draft: t("reports.status.draft"),
    ready: t("reports.status.ready"),
    generating_pdf: t("reports.status.generating_pdf"),
    pdf_ready: t("reports.status.pdf_ready"),
    pdf_failed: t("reports.status.pdf_failed"),
  };
  const REPORT_TYPE_LABEL: Record<ReportType, string> = {
    internal: t("reports.reportType.internal"),
    client: t("reports.reportType.client"),
    executive: t("reports.reportType.executive"),
  };
  const sorted = [...reports].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold text-foreground">{t("reports.history.title")}</h2>
      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("reports.history.empty")}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {sorted.map((report) => (
            <li key={report.id} className="flex items-center justify-between gap-3 py-2 text-sm first:pt-0 last:pb-0">
              <div className="flex min-w-0 flex-col">
                <span className="font-medium text-foreground">
                  {report.periodStart} → {report.periodEnd}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {REPORT_TYPE_LABEL[report.reportType]} · {formatPlatforms(report.platform, PLATFORM_LABEL, t("reports.history.allPlatforms"))} · {REPORT_STATUS_LABEL[report.status]}
                </span>
                {report.document?.narrative.executiveSummary.narrative && (
                  <span className="mt-1 truncate text-xs text-muted-foreground">
                    {report.document.narrative.executiveSummary.narrative}
                  </span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {report.document && (
                  <button
                    type="button"
                    onClick={() => onOpen(report)}
                    className="text-xs font-medium text-violet-600 hover:underline dark:text-violet-400"
                  >
                    {t("reports.history.open")}
                  </button>
                )}
                {report.storedFileUrl && (
                  <a
                    href={report.storedFileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-violet-600 hover:underline dark:text-violet-400"
                  >
                    {t("reports.history.pdfLink")}
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
