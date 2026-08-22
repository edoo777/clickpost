import { BetaCodesAdminPanel } from "@/components/admin/BetaCodesAdminPanel";
import { listActiveBetaGrants, listBetaCodes } from "@/lib/billing/beta-codes";
import { PRICING_PLANS } from "@/lib/marketing/pricing-config";

export default async function AdminBetaPage() {
  const [codes, grants] = await Promise.all([listBetaCodes(), listActiveBetaGrants()]);
  const planKeys = PRICING_PLANS.map((plan) => plan.key);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Accès bêta testeurs</h1>
        <p className="text-sm text-muted-foreground">
          Système temporaire pour donner un accès à un plan payant (par défaut Agence) à des
          bêta-testeurs sans passer par Stripe. N&apos;affecte jamais un abonnement réel : les codes
          et les accès accordés ici vivent dans une superposition séparée
          (`workspace_subscriptions.beta_*`), jamais dans `plan_key`/`status`. Un accès expire
          automatiquement à la date prévue, sans action requise ici.
        </p>
      </header>

      <BetaCodesAdminPanel initialCodes={codes} initialGrants={grants} planKeys={planKeys} />
    </div>
  );
}
