import { FeatureFlagToggle } from "@/components/admin/FeatureFlagToggle";
import { listFeatureFlags } from "@/lib/admin/feature-flags";

export default async function AdminFeatureFlagsPage() {
  const flags = await listFeatureFlags();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Fonctionnalités</h1>
        <p className="text-sm text-muted-foreground">
          Interrupteurs simples pour des fonctionnalités en préparation. Activer un interrupteur
          ici ne construit rien : pour les intégrations non développées (Instagram, Facebook,
          TikTok, YouTube), ces réglages restent des réservations pour une activation future, sans
          effet fonctionnel tant que l&apos;intégration elle-même n&apos;existe pas dans le code.
          Seul « Export PDF Gamma » a un effet réel dès aujourd&apos;hui (combiné à la variable
          serveur GAMMA_API_KEY).
        </p>
      </header>

      <div className="flex flex-col gap-3">
        {flags.map((flag) => (
          <FeatureFlagToggle key={flag.key} flag={flag} />
        ))}
      </div>
    </div>
  );
}
