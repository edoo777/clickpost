"use client";

import { useState } from "react";
import type { ActiveBetaGrant } from "@/lib/billing/beta-codes";
import type { BetaCode } from "@/types/billing";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

interface BetaCodesAdminPanelProps {
  initialCodes: BetaCode[];
  initialGrants: ActiveBetaGrant[];
  planKeys: string[];
}

export function BetaCodesAdminPanel({ initialCodes, initialGrants, planKeys }: BetaCodesAdminPanelProps) {
  const [codes, setCodes] = useState(initialCodes);
  const [grants, setGrants] = useState(initialGrants);
  const [newCode, setNewCode] = useState("");
  const [newPlanKey, setNewPlanKey] = useState(planKeys.includes("agency") ? "agency" : (planKeys[0] ?? ""));
  const [newDuration, setNewDuration] = useState(30);
  const [newMaxUses, setNewMaxUses] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleCreate() {
    if (!newCode.trim() || !newPlanKey) return;
    setIsCreating(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/admin/beta-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode.trim(),
          planKey: newPlanKey,
          grantDurationDays: newDuration,
          maxUses: newMaxUses.trim() ? Number(newMaxUses) : null,
        }),
      });
      const data = await response.json();
      if (data.status !== "ok") throw new Error(data.message ?? "Erreur inconnue");
      setCodes((prev) => [data.code as BetaCode, ...prev]);
      setNewCode("");
      setNewMaxUses("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleToggleActive(code: BetaCode) {
    setBusyId(code.id);
    try {
      const response = await fetch(`/api/admin/beta-codes/${code.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !code.active }),
      });
      const data = await response.json();
      if (data.status !== "ok") return;
      setCodes((prev) => prev.map((c) => (c.id === code.id ? { ...c, active: !code.active } : c)));
    } finally {
      setBusyId(null);
    }
  }

  async function handleRevoke(workspaceId: string) {
    setBusyId(workspaceId);
    try {
      const response = await fetch("/api/admin/beta-grants/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const data = await response.json();
      if (data.status !== "ok") return;
      setGrants((prev) => prev.filter((grant) => grant.workspaceId !== workspaceId));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-foreground">Créer un code bêta</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Code</label>
            <input
              type="text"
              value={newCode}
              onChange={(event) => setNewCode(event.target.value)}
              placeholder="CLICKPOST-BETA-AGENCY"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Plan accordé</label>
            <select
              value={newPlanKey}
              onChange={(event) => setNewPlanKey(event.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              {planKeys.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Durée (jours)</label>
            <input
              type="number"
              min={1}
              value={newDuration}
              onChange={(event) => setNewDuration(Number(event.target.value) || 30)}
              className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Utilisations max (optionnel)</label>
            <input
              type="number"
              min={1}
              value={newMaxUses}
              onChange={(event) => setNewMaxUses(event.target.value)}
              placeholder="Illimité"
              className="w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
          <button
            type="button"
            disabled={isCreating || !newCode.trim()}
            onClick={() => void handleCreate()}
            className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isCreating ? "Création…" : "Créer le code"}
          </button>
        </div>
        {errorMessage && <p className="text-xs font-medium text-red-600 dark:text-red-400">{errorMessage}</p>}
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-foreground">Codes existants</h2>
        {codes.length === 0 && <p className="text-xs text-muted-foreground">Aucun code créé.</p>}
        {codes.map((code) => (
          <div key={code.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{code.code}</span>
              <span className="text-xs text-muted-foreground">
                Plan {code.planKey} · {code.grantDurationDays} jours · {code.usedCount} utilisation{code.usedCount > 1 ? "s" : ""}
                {code.maxUses !== null ? ` / ${code.maxUses}` : ""}
              </span>
            </div>
            <button
              type="button"
              disabled={busyId === code.id}
              onClick={() => void handleToggleActive(code)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-60 ${
                code.active
                  ? "border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                  : "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
              }`}
            >
              {code.active ? "Désactiver" : "Réactiver"}
            </button>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-foreground">Accès bêta accordés</h2>
        {grants.length === 0 && <p className="text-xs text-muted-foreground">Aucun accès bêta actif.</p>}
        {grants.map((grant) => (
          <div key={grant.workspaceId} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{grant.workspaceName}</span>
              <span className="text-xs text-muted-foreground">
                Plan {grant.betaPlanKey} · expire le {dateFormatter.format(new Date(grant.betaExpiresAt))}
              </span>
            </div>
            <button
              type="button"
              disabled={busyId === grant.workspaceId}
              onClick={() => void handleRevoke(grant.workspaceId)}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              Révoquer
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
