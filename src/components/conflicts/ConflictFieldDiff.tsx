"use client";

import { formatFieldValue, type ConflictFieldRow } from "@/lib/conflict-display";

interface ConflictFieldDiffProps {
  rows: ConflictFieldRow[];
  mode: "compare" | "merge";
  selections?: Record<string, "local" | "remote">;
  onSelect?: (key: string, source: "local" | "remote") => void;
}

const CELL_CLASS = "grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)] gap-3";

/** Comparaison champ par champ, générique pour les 11 types d'entités synchronisées — sans
 * logique métier spécifique par table (F1.7). En mode fusion, chaque champ différent devient
 * sélectionnable (valeur locale ou distante). */
export function ConflictFieldDiff({ rows, mode, selections, onSelect }: ConflictFieldDiffProps) {
  return (
    <div className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border">
      <div className={`${CELL_CLASS} bg-muted px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground`}>
        <span>Champ</span>
        <span>Version locale</span>
        <span>Version distante</span>
      </div>
      {rows.map((row) => (
        <div key={row.key} className={`${CELL_CLASS} px-4 py-2.5 text-sm ${row.isDifferent ? "bg-amber-50 dark:bg-amber-500/5" : ""}`}>
          <span className="truncate font-medium text-zinc-700 dark:text-zinc-300">{row.key}</span>
          {mode === "merge" && row.isDifferent ? (
            <>
              <button
                type="button"
                onClick={() => onSelect?.(row.key, "local")}
                aria-pressed={selections?.[row.key] === "local"}
                className={`truncate rounded-lg border px-2 py-1 text-left transition-colors ${
                  selections?.[row.key] === "local"
                    ? "border-violet-400 bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                    : "border-border text-muted-foreground hover:border-violet-200"
                }`}
              >
                {formatFieldValue(row.localValue)}
              </button>
              <button
                type="button"
                onClick={() => onSelect?.(row.key, "remote")}
                aria-pressed={selections?.[row.key] === "remote"}
                className={`truncate rounded-lg border px-2 py-1 text-left transition-colors ${
                  selections?.[row.key] === "remote"
                    ? "border-violet-400 bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                    : "border-border text-muted-foreground hover:border-violet-200"
                }`}
              >
                {formatFieldValue(row.remoteValue)}
              </button>
            </>
          ) : (
            <>
              <span className={`truncate ${row.isDifferent ? "font-semibold text-amber-700 dark:text-amber-400" : "text-muted-foreground"}`}>
                {formatFieldValue(row.localValue)}
              </span>
              <span className={`truncate ${row.isDifferent ? "font-semibold text-amber-700 dark:text-amber-400" : "text-muted-foreground"}`}>
                {formatFieldValue(row.remoteValue)}
              </span>
            </>
          )}
        </div>
      ))}
      {rows.length === 0 && <p className="px-4 py-6 text-center text-sm text-muted-foreground">Aucun champ à comparer.</p>}
    </div>
  );
}
