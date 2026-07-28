"use client";

import { useState } from "react";
import type { ContentVersion } from "@/types/content-version";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

interface ContentVersionsPanelProps {
  versions: ContentVersion[];
  onSaveNewVersion: () => void;
  onRestore: (versionId: string) => void;
  onDuplicate: (versionId: string) => void;
  onDelete: (versionId: string) => void;
}

export function ContentVersionsPanel({
  versions,
  onSaveNewVersion,
  onRestore,
  onDuplicate,
  onDelete,
}: ContentVersionsPanelProps) {
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const sorted = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);

  function toggleCompare(id: string) {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((candidate) => candidate !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }

  const compareVersions = sorted.filter((version) => compareIds.includes(version.id));

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-black/[.08] bg-white p-5 dark:border-white/[.08] dark:bg-zinc-950">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Versions</h2>
        <button
          type="button"
          onClick={onSaveNewVersion}
          className="rounded-lg bg-zinc-950 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
        >
          Enregistrer une nouvelle version
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-zinc-400 dark:text-zinc-600">Aucune version enregistrée pour l&apos;instant.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((version) => (
            <div
              key={version.id}
              className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 ${
                version.isCurrent
                  ? "border-zinc-950 dark:border-zinc-50"
                  : "border-black/[.08] dark:border-white/[.08]"
              }`}
            >
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={compareIds.includes(version.id)}
                  onChange={() => toggleCompare(version.id)}
                  aria-label="Sélectionner pour comparer"
                />
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {version.name || `Version ${version.versionNumber}`}
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-600">
                  {dateFormatter.format(new Date(version.createdAt))} ·{" "}
                  {version.source === "ai" ? "IA" : "Manuelle"}
                </span>
                {version.isCurrent && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                    Version courante
                  </span>
                )}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onRestore(version.id)}
                  disabled={version.isCurrent}
                  className="rounded-lg border border-black/[.08] px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/[.08] dark:text-zinc-400 dark:hover:bg-zinc-900"
                >
                  Restaurer
                </button>
                <button
                  type="button"
                  onClick={() => onDuplicate(version.id)}
                  className="rounded-lg border border-black/[.08] px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-white/[.08] dark:text-zinc-400 dark:hover:bg-zinc-900"
                >
                  Dupliquer
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(version.id)}
                  className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {compareVersions.length === 2 && (
        <div className="grid grid-cols-1 gap-4 border-t border-black/[.06] pt-4 sm:grid-cols-2 dark:border-white/[.06]">
          {compareVersions.map((version) => (
            <div
              key={version.id}
              className="flex flex-col gap-2 rounded-lg border border-black/[.08] p-3 text-sm dark:border-white/[.08]"
            >
              <h3 className="font-medium text-zinc-800 dark:text-zinc-200">
                {version.name || `Version ${version.versionNumber}`}
              </h3>
              {version.format === "text" && (
                <dl className="flex flex-col gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <div>
                    <dt className="font-medium text-zinc-400 dark:text-zinc-600">Accroche</dt>
                    <dd>{version.body.hook || "—"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-zinc-400 dark:text-zinc-600">Introduction</dt>
                    <dd>{version.body.intro || "—"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-zinc-400 dark:text-zinc-600">Corps</dt>
                    <dd className="whitespace-pre-wrap">{version.body.body || "—"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-zinc-400 dark:text-zinc-600">Conclusion</dt>
                    <dd>{version.body.conclusion || "—"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-zinc-400 dark:text-zinc-600">Appel à l&apos;action</dt>
                    <dd>{version.body.cta || "—"}</dd>
                  </div>
                </dl>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
