"use client";

import { useState } from "react";
import { FORMAT_LABEL } from "@/lib/editorial-constants";
import type { ContentVersion } from "@/types/content-version";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-medium text-muted-foreground ">{label}</dt>
      <dd className="whitespace-pre-wrap">{value || "—"}</dd>
    </div>
  );
}

function VersionSummary({ version }: { version: ContentVersion }) {
  return (
    <dl className="flex flex-col gap-2 text-xs text-muted-foreground ">
      {version.format === "text" && (
        <>
          <Field label="Accroche" value={version.body.hook} />
          <Field label="Introduction" value={version.body.intro} />
          <Field label="Corps" value={version.body.body} />
          <Field label="Conclusion" value={version.body.conclusion} />
          <Field label="Appel à l'action" value={version.body.cta} />
        </>
      )}
      {version.format === "carousel" && (
        <>
          <Field label="Titre de couverture" value={version.body.coverTitle} />
          <Field label="Accroche" value={version.body.hook} />
          <Field
            label={`Diapositives (${version.body.slides.length})`}
            value={version.body.slides.map((slide, i) => `${i + 1}. ${slide.title} — ${slide.text}`).join("\n")}
          />
          <Field label="Conclusion" value={version.body.conclusion} />
          <Field label="Appel à l'action" value={version.body.cta} />
        </>
      )}
      {version.format === "short_video" && (
        <>
          <Field label="Accroche" value={version.body.hook} />
          <Field label="Script" value={version.body.script} />
          <Field label="Durée estimée" value={version.body.durationSeconds ? `${version.body.durationSeconds} s` : ""} />
          <Field label="Appel à l'action" value={version.body.cta} />
        </>
      )}
      {version.format === "story" && (
        <Field
          label={`Écrans (${version.body.screens.length})`}
          value={version.body.screens.map((screen, i) => `${i + 1}. ${screen.text}`).join("\n")}
        />
      )}
      {version.format === "image" && (
        <>
          <Field label="Concept visuel" value={version.body.concept} />
          <Field label="Texte sur l'image" value={version.body.onImageText ?? ""} />
          <Field label="Légende" value={version.body.caption} />
          <Field label="Appel à l'action" value={version.body.cta} />
        </>
      )}
      {version.format === "article" && (
        <>
          <Field label="Titre" value={version.body.title} />
          <Field label="Introduction" value={version.body.intro} />
          <Field label="Plan" value={version.body.plan.join(" · ")} />
          <Field label="Conclusion" value={version.body.conclusion} />
        </>
      )}
    </dl>
  );
}

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
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5  ">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground ">Versions</h2>
        <button
          type="button"
          onClick={onSaveNewVersion}
          className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40 dark:shadow-fuchsia-500/10"
        >
          Enregistrer une nouvelle version
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground ">Aucune version enregistrée pour l&apos;instant.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((version) => (
            <div
              key={version.id}
              className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 ${
                version.isCurrent
                  ? "border-violet-500 ring-1 ring-violet-500/20 dark:border-violet-400"
                  : "border-border "
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
                <span className="text-xs text-muted-foreground ">
                  {FORMAT_LABEL[version.format]} · {dateFormatter.format(new Date(version.createdAt))} ·{" "}
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
                  className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
                >
                  Restaurer
                </button>
                <button
                  type="button"
                  onClick={() => onDuplicate(version.id)}
                  className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
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
        <div className="grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-2 ">
          {compareVersions.map((version) => (
            <div
              key={version.id}
              className="flex flex-col gap-2 rounded-lg border border-border p-3 text-sm "
            >
              <h3 className="font-medium text-zinc-800 dark:text-zinc-200">
                {version.name || `Version ${version.versionNumber}`}
              </h3>
              <VersionSummary version={version} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
