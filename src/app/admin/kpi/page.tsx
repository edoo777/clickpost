import Link from "next/link";
import { getAdminBusinessSnapshot, type PeriodPreset } from "@/lib/admin/analytics";

const PERIODS: { value: PeriodPreset; label: string }[] = [
  { value: "7", label: "7 jours" },
  { value: "30", label: "30 jours" },
  { value: "90", label: "90 jours" },
  { value: "365", label: "1 an" },
];

function isPeriod(value: string | undefined): value is PeriodPreset {
  return value === "7" || value === "30" || value === "90" || value === "365";
}

function KpiCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xl font-semibold text-foreground">{value}</span>
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </div>
  );
}

export default async function AdminKpiPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const rawPeriod = Array.isArray(params.periode) ? params.periode[0] : params.periode;
  const period: PeriodPreset = isPeriod(rawPeriod) ? rawPeriod : "30";

  const snapshot = await getAdminBusinessSnapshot(period);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tableau de bord business</h1>
        <p className="text-sm text-muted-foreground">
          Indicateurs calculés uniquement à partir de données réellement observées (aucune donnée
          financière inventée) — voir docs/FINAL-BETA-READINESS.md pour ce qui reste indisponible
          tant qu&apos;aucune intégration de paiement réelle n&apos;est connectée.
        </p>
      </header>

      <div className="flex gap-1.5">
        {PERIODS.map((option) => (
          <Link
            key={option.value}
            href={`/admin/kpi?periode=${option.value}`}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              period === option.value
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                : "border border-border text-zinc-600 hover:bg-muted dark:text-zinc-400"
            }`}
          >
            {option.label}
          </Link>
        ))}
      </div>

      {snapshot.payingSubscriptions === 0 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
          Aucun abonnement payant actif — intégration de paiement (Stripe) non connectée. MRR,
          churn, ARPU et conversion essai→payant resteront à « — » tant qu&apos;aucun paiement réel
          n&apos;a été traité. L&apos;architecture (table <code>workspace_subscriptions</code>) est
          prête à les calculer automatiquement dès qu&apos;un vrai abonnement existera.
        </p>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">Vue d&apos;ensemble</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard label="Utilisateurs (total)" value={snapshot.totals.profiles} />
          <KpiCard label="Workspaces (total)" value={snapshot.totals.workspaces} />
          <KpiCard label="Marques actives (total)" value={snapshot.totals.brands} />
          <KpiCard label="Comptes sociaux connectés" value={snapshot.totals.connectedAccounts} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">Activité (DAU / WAU / MAU)</h2>
        <div className="grid grid-cols-3 gap-3">
          <KpiCard label="Actifs / jour" value={snapshot.usage.dau} />
          <KpiCard label="Actifs / semaine" value={snapshot.usage.wau} />
          <KpiCard label="Actifs / mois" value={snapshot.usage.mau} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">Entonnoir — période sélectionnée</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <KpiCard label="Visiteurs" value="—" hint="Non instrumenté (page publique)" />
          <KpiCard label="Inscriptions" value={snapshot.funnel.signup} />
          <KpiCard label="Onboarding démarré" value={snapshot.funnel.onboardingStarted} />
          <KpiCard label="Onboarding terminé" value={snapshot.funnel.onboardingCompleted} />
          <KpiCard label="Workspace créé" value={snapshot.funnel.workspaceCreated} />
          <KpiCard label="Réseau social connecté" value={snapshot.funnel.socialConnected} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">Contenu &amp; IA — période sélectionnée</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard label="Publications créées" value={snapshot.usage.publicationsCreated} />
          <KpiCard label="Publications publiées" value={snapshot.usage.publicationsPublished} />
          <KpiCard label="Générations IA" value={snapshot.usage.aiGenerationCount} />
          <KpiCard
            label="Coût IA estimé"
            value={`${snapshot.usage.aiEstimatedCostUsd.toFixed(2)} $`}
            hint="Estimation à partir des tokens réels — voir usage-tracking.ts"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-foreground">Répartition par plan</h2>
          {snapshot.planBreakdown.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucune donnée.</p>
          ) : (
            <ul className="flex flex-col gap-1.5 text-sm">
              {snapshot.planBreakdown.map((row) => (
                <li key={row.planKey} className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">{row.planName}</span>
                  <span className="font-medium text-foreground">{row.workspaceCount}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-foreground">Répartition par réseau (comptes connectés)</h2>
          {snapshot.platformBreakdown.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucun compte connecté pour l&apos;instant.</p>
          ) : (
            <ul className="flex flex-col gap-1.5 text-sm">
              {snapshot.platformBreakdown.map((row) => (
                <li key={row.platform} className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">{row.platform}</span>
                  <span className="font-medium text-foreground">{row.connectedAccounts}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-foreground">Fonctionnalités IA les plus utilisées</h2>
          {snapshot.topFeatures.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucun appel IA journalisé sur la période.</p>
          ) : (
            <ul className="flex flex-col gap-1.5 text-sm">
              {snapshot.topFeatures.map((row) => (
                <li key={row.featureKey} className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">{row.featureKey}</span>
                  <span className="font-medium text-foreground">{row.callCount}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-foreground">Créateurs vs équipes/agences</h2>
          <p className="text-[11px] text-muted-foreground">
            Estimation basée sur le nombre de membres actifs par workspace (1 = solo, 2+ = équipe).
          </p>
          <ul className="flex flex-col gap-1.5 text-sm">
            <li className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Workspaces solo</span>
              <span className="font-medium text-foreground">{snapshot.workspaceSize.solo}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Workspaces équipe/agence</span>
              <span className="font-medium text-foreground">{snapshot.workspaceSize.team}</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-foreground">Facturation</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard label="MRR" value="—" hint="Stripe non connecté" />
          <KpiCard label="Churn MRR" value="—" hint="Stripe non connecté" />
          <KpiCard label="ARPU" value="—" hint="Stripe non connecté" />
          <KpiCard label="Conversion essai → payant" value="—" hint="Stripe non connecté" />
          <KpiCard label="Abonnements payants actifs" value={snapshot.payingSubscriptions} />
        </div>
      </section>
    </div>
  );
}
