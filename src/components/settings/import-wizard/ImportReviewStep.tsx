"use client";

import { useMemo, useState } from "react";
import { CONFLICT_ENTITY_LABEL } from "@/lib/conflict-display";
import { useBrandsSession } from "@/lib/brands-store";
import { journalKey } from "@/lib/sync/local-import-runner";
import type { SyncEntityType } from "@/lib/sync/types";
import type { DuplicateAction, ImportCandidate, ImportScanResult } from "@/types/import-wizard";

interface ImportReviewStepProps {
  scanResult: ImportScanResult;
  selectedKeys: Set<string>;
  onChangeSelectedKeys: (keys: Set<string>) => void;
  duplicateActions: Map<string, DuplicateAction>;
  onChangeDuplicateActions: (map: Map<string, DuplicateAction>) => void;
  brandOverrides: Map<string, string>;
  onChangeBrandOverrides: (map: Map<string, string>) => void;
  onNext: () => void;
  onCancel: () => void;
}

const FIELD_CLASS = "rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground";

/** Étapes 3 à 6 : sélection des catégories, aperçu détaillé, doublons et dépendances,
 * sélection individuelle (F1.8). Aucune écriture cloud n'a lieu ici — uniquement la
 * préparation de la sélection que l'utilisateur confirmera explicitement plus loin. */
export function ImportReviewStep({
  scanResult,
  selectedKeys,
  onChangeSelectedKeys,
  duplicateActions,
  onChangeDuplicateActions,
  brandOverrides,
  onChangeBrandOverrides,
  onNext,
  onCancel,
}: ImportReviewStepProps) {
  const { selectableBrands, canManageBrands } = useBrandsSession();
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState<SyncEntityType | "all">("all");

  const entityTypesPresent = useMemo(
    () => Array.from(new Set(scanResult.candidates.map((candidate) => candidate.entityType))),
    [scanResult]
  );

  const filtered = scanResult.candidates.filter((candidate) => {
    if (entityFilter !== "all" && candidate.entityType !== entityFilter) return false;
    if (search.trim() && !candidate.title.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });

  function isBlocked(candidate: ImportCandidate): boolean {
    const key = journalKey(candidate.entityType, candidate.recordId);
    return candidate.dependencies.some((dep) => {
      if (!dep.required || dep.status !== "missing") return false;
      if (dep.entityType === "brands" && brandOverrides.has(key)) return false;
      // Le parent n'est pas distant, mais son propre candidat est sélectionné dans cette
      // même session : il sera importé avant (ordre des lots), la dépendance est satisfaite.
      if (selectedKeys.has(journalKey(dep.entityType, dep.refId))) return false;
      return true;
    });
  }

  function toggle(candidate: ImportCandidate) {
    const key = journalKey(candidate.entityType, candidate.recordId);
    if (isBlocked(candidate)) return;
    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChangeSelectedKeys(next);
  }

  function toggleCategory(entityType: SyncEntityType, select: boolean) {
    const next = new Set(selectedKeys);
    for (const candidate of scanResult.candidates) {
      if (candidate.entityType !== entityType) continue;
      const key = journalKey(candidate.entityType, candidate.recordId);
      if (isBlocked(candidate)) continue;
      if (select) next.add(key);
      else next.delete(key);
    }
    onChangeSelectedKeys(next);
  }

  function setDuplicateAction(candidate: ImportCandidate, action: DuplicateAction) {
    const key = journalKey(candidate.entityType, candidate.recordId);
    const next = new Map(duplicateActions);
    next.set(key, action);
    onChangeDuplicateActions(next);
  }

  function setBrandOverride(candidate: ImportCandidate, brandId: string) {
    const key = journalKey(candidate.entityType, candidate.recordId);
    const next = new Map(brandOverrides);
    if (brandId) next.set(key, brandId);
    else next.delete(key);
    onChangeBrandOverrides(next);
    // Un rattachement choisi débloque automatiquement la sélection si elle était refusée jusque-là.
  }

  const selectedCount = selectedKeys.size;
  const excludedDemoTotal = Object.values(scanResult.excludedSeedCount).reduce((sum, n) => sum + (n ?? 0), 0);
  const alreadySyncedTotal = Object.values(scanResult.alreadySyncedCount).reduce((sum, n) => sum + (n ?? 0), 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryStat label="Candidats trouvés" value={scanResult.candidates.length} />
        <SummaryStat label="Sélectionnés" value={selectedCount} accent />
        <SummaryStat label="Exclus (démonstration)" value={excludedDemoTotal} />
        <SummaryStat label="Déjà synchronisés" value={alreadySyncedTotal} />
      </div>

      {scanResult.candidates.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-muted-foreground dark:border-white/[.12]">
          Aucune ancienne donnée locale à importer n&apos;a été trouvée.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {entityTypesPresent.map((entityType) => {
              const count = scanResult.candidates.filter((c) => c.entityType === entityType).length;
              const selectedInCategory = scanResult.candidates.filter(
                (c) => c.entityType === entityType && selectedKeys.has(journalKey(c.entityType, c.recordId))
              ).length;
              return (
                <div key={entityType} className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs">
                  <span className="font-medium text-foreground">{CONFLICT_ENTITY_LABEL[entityType]}</span>
                  <span className="text-muted-foreground">
                    {selectedInCategory}/{count}
                  </span>
                  <button type="button" onClick={() => toggleCategory(entityType, true)} className="text-violet-600 hover:underline dark:text-violet-400">
                    Tout
                  </button>
                  <button type="button" onClick={() => toggleCategory(entityType, false)} className="text-muted-foreground hover:underline">
                    Aucun
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher…"
              className={`${FIELD_CLASS} w-full sm:w-56`}
            />
            <select value={entityFilter} onChange={(event) => setEntityFilter(event.target.value as SyncEntityType | "all")} className={FIELD_CLASS}>
              <option value="all">Tous les types</option>
              {entityTypesPresent.map((entityType) => (
                <option key={entityType} value={entityType}>
                  {CONFLICT_ENTITY_LABEL[entityType]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
            {filtered.map((candidate) => {
              const key = journalKey(candidate.entityType, candidate.recordId);
              const blocked = isBlocked(candidate);
              const isDuplicate = candidate.isDuplicateId || Boolean(candidate.fingerprintDuplicateOf);
              const missingBrandDep = candidate.dependencies.find((dep) => dep.entityType === "brands" && dep.status === "missing");

              return (
                <div key={key} className={`flex flex-col gap-1.5 rounded-xl border px-3 py-2.5 text-sm ${blocked ? "border-amber-200 bg-amber-50/50 dark:border-amber-500/20 dark:bg-amber-500/5" : "border-border"}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedKeys.has(key)}
                      disabled={blocked}
                      onChange={() => toggle(candidate)}
                      className="h-4 w-4 shrink-0 rounded border-zinc-300 dark:border-white/[.2]"
                    />
                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                      {CONFLICT_ENTITY_LABEL[candidate.entityType]}
                    </span>
                    <span className="truncate font-medium text-foreground">{candidate.title}</span>
                    {isDuplicate && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                        Doublon potentiel
                      </span>
                    )}
                  </div>

                  {candidate.dependencies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pl-6 text-[11px] text-muted-foreground">
                      {candidate.dependencies.map((dep) => (
                        <span
                          key={dep.field}
                          className={dep.status === "missing" && dep.required ? "font-medium text-amber-700 dark:text-amber-400" : ""}
                        >
                          {dep.field} : {dep.status === "present" ? "présent" : "manquant"}
                          {dep.required ? "" : " (optionnel)"}
                        </span>
                      ))}
                    </div>
                  )}

                  {missingBrandDep && !canManageBrands && (
                    <p className="pl-6 text-[11px] text-muted-foreground">
                      Seuls les administrateurs peuvent rattacher une marque de destination.
                    </p>
                  )}
                  {missingBrandDep && canManageBrands && (
                    <label className="flex items-center gap-2 pl-6 text-[11px] text-muted-foreground">
                      Marque de destination
                      <select
                        value={brandOverrides.get(key) ?? ""}
                        onChange={(event) => setBrandOverride(candidate, event.target.value)}
                        className={FIELD_CLASS}
                      >
                        <option value="">Choisir…</option>
                        {selectableBrands.map((brand) => (
                          <option key={brand.id} value={brand.id}>
                            {brand.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  {isDuplicate && (
                    <div className="flex items-center gap-2 pl-6 text-[11px]">
                      <span className="text-muted-foreground">Doublon :</span>
                      <select
                        value={duplicateActions.get(key) ?? ""}
                        onChange={(event) => setDuplicateAction(candidate, event.target.value as DuplicateAction)}
                        className={FIELD_CLASS}
                      >
                        <option value="">Par défaut (importer comme nouveau)</option>
                        <option value="ignore">Ignorer l&apos;élément local</option>
                        <option value="import_as_new">Importer comme nouvel élément</option>
                        <option value="associate_existing">Associer à l&apos;élément distant existant</option>
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-6 text-center text-xs text-muted-foreground dark:border-white/[.12]">
                Aucun élément ne correspond à ces filtres.
              </p>
            )}
          </div>
        </>
      )}

      <div className="flex justify-between border-t border-border pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
        >
          Annuler
        </button>
        <button
          type="button"
          disabled={selectedCount === 0}
          onClick={onNext}
          className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continuer ({selectedCount})
        </button>
      </div>
    </div>
  );
}

function SummaryStat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <p className={`text-xl font-semibold ${accent ? "text-violet-600 dark:text-violet-400" : "text-foreground"}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
