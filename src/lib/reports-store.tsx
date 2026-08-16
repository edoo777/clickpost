"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useSyncedPersistedState } from "@/lib/sync/use-synced-state";
import type { Report } from "@/types/report";

interface ReportsSessionValue {
  reports: Report[];
  addReport: (report: Report) => void;
  updateReport: (id: string, patch: Partial<Report>) => void;
  removeReport: (id: string) => void;
  getReportsByBrand: (brandId: string) => Report[];
}

const ReportsSessionContext = createContext<ReportsSessionValue | null>(null);

export function ReportsSessionProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useSyncedPersistedState<"reports">("reports", [], "reports");

  const value = useMemo<ReportsSessionValue>(
    () => ({
      reports,
      addReport: (report) => setReports((prev) => [...prev, report]),
      updateReport: (id, patch) =>
        setReports((prev) =>
          prev.map((report) =>
            report.id === id ? { ...report, ...patch, updatedAt: new Date().toISOString() } : report
          )
        ),
      removeReport: (id) => setReports((prev) => prev.filter((report) => report.id !== id)),
      getReportsByBrand: (brandId) => reports.filter((report) => report.brandId === brandId),
    }),
    [reports, setReports]
  );

  return <ReportsSessionContext.Provider value={value}>{children}</ReportsSessionContext.Provider>;
}

export function useReportsSession() {
  const context = useContext(ReportsSessionContext);
  if (!context) {
    throw new Error("useReportsSession must be used within a ReportsSessionProvider");
  }
  return context;
}
