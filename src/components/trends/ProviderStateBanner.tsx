import type { ProviderResultStatus } from "@/types/trend";

const MESSAGES: Record<Exclude<ProviderResultStatus, "ok">, string> = {
  config_missing: "Source non configurée sur ce serveur.",
  quota_exceeded: "Quota atteint pour cette source — réessayez plus tard.",
  unavailable: "Aucune source officielle configurée pour cette plateforme.",
  error: "Cette source est momentanément indisponible.",
};

export function ProviderStateBanner({ status, message }: { status: Exclude<ProviderResultStatus, "ok">; message?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
      {message ?? MESSAGES[status]}
    </div>
  );
}
