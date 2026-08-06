"use client";

import { useEffect, useState } from "react";
import { LinkedInOrganizationsPanel } from "@/components/accounts/LinkedInOrganizationsPanel";
import { OAUTH_CONNECTION_STATE_LABEL, type OAuthConnectionSummary } from "@/types/oauth-connection";
import type { SocialAccount } from "@/types/dashboard";

const ORGANIZATION_SCOPES = ["r_organization_admin", "w_organization_social"];

// Duplication volontaire (pas d'import de organizations.ts/config.ts ici) : ces modules tirent
// des dépendances serveur uniquement (service-role, chiffrement) qui ne doivent jamais entrer
// dans le bundle client, même indirectement — voir la même décision documentée pour providers.ts.
function isLinkedInOrganizationAccount(externalAccountId: string | undefined): boolean {
  return Boolean(externalAccountId?.startsWith("urn:li:organization:"));
}

const STATE_TONE: Record<OAuthConnectionSummary["state"], "muted" | "success" | "warning" | "error"> = {
  not_configured: "muted",
  no_local_account: "muted",
  local_profile_only: "muted",
  authorization_pending: "warning",
  connected: "success",
  token_expired: "warning",
  insufficient_permission: "warning",
  disconnected: "muted",
  temporary_error: "warning",
  persistent_error: "error",
};

const TONE_CLASS: Record<"muted" | "success" | "warning" | "error", string> = {
  muted: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  error: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

interface LinkedInConnectionPanelProps {
  account: SocialAccount;
  onDisconnected: () => void;
}

/**
 * Panneau spécifique LinkedIn (plateforme pilote) — jamais affiché pour une autre plateforme.
 * Interroge /api/social/linkedin/status côté serveur (seule route qui connaît réellement l'état
 * de configuration, dépendant de variables d'environnement serveur) : ne devine jamais l'état de
 * connexion depuis le seul navigateur.
 */
export function LinkedInConnectionPanel({ account, onDisconnected }: LinkedInConnectionPanelProps) {
  const [summary, setSummary] = useState<OAuthConnectionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (cancelled) return;
      setIsLoading(true);
      fetch(`/api/social/linkedin/status?accountId=${encodeURIComponent(account.id)}`)
        .then((response) => response.json())
        .then((body: { status: string; summary?: OAuthConnectionSummary }) => {
          if (cancelled) return;
          if (body.status === "ok" && body.summary) setSummary(body.summary);
        })
        .catch(() => {
          if (!cancelled) setError("État de connexion LinkedIn indisponible pour le moment.");
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [account.id]);

  async function handleDisconnect() {
    if (isDisconnecting) return; // empêche les doubles clics.
    setIsDisconnecting(true);
    setError(null);
    try {
      const response = await fetch("/api/social/linkedin/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: account.id }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        setError(body?.message ?? "Déconnexion impossible.");
        return;
      }
      onDisconnected();
    } catch {
      setError("Déconnexion impossible (réseau).");
    } finally {
      setIsDisconnecting(false);
    }
  }

  if (isLoading) {
    return <p className="text-xs text-muted-foreground ">Vérification de la connexion LinkedIn…</p>;
  }

  const state = summary?.state ?? "no_local_account";
  const tone = STATE_TONE[state];

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-zinc-100 p-3 dark:bg-zinc-800/60">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Connexion LinkedIn réelle</span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${TONE_CLASS[tone]}`}>
          {OAUTH_CONNECTION_STATE_LABEL[state]}
        </span>
      </div>

      {state === "not_configured" && (
        <p className="text-xs text-muted-foreground ">
          L&apos;intégration LinkedIn n&apos;est pas encore configurée sur ce serveur (identifiants
          d&apos;application manquants).
        </p>
      )}

      {(state === "no_local_account" || state === "local_profile_only" || state === "disconnected") && account.brandId && (
        <a
          href={`/api/social/linkedin/connect?brandId=${encodeURIComponent(account.brandId)}`}
          className="w-fit rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-fuchsia-500/20"
        >
          Connecter LinkedIn
        </a>
      )}

      {state === "token_expired" && account.brandId && (
        <a
          href={`/api/social/linkedin/connect?brandId=${encodeURIComponent(account.brandId)}`}
          className="w-fit rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400"
        >
          Reconnecter LinkedIn
        </a>
      )}

      {state === "insufficient_permission" && summary?.message && (
        <p className="text-xs text-amber-700 dark:text-amber-400">{summary.message}</p>
      )}

      {(state === "connected" || state === "token_expired" || state === "insufficient_permission") && (
        <button
          type="button"
          onClick={() => void handleDisconnect()}
          disabled={isDisconnecting}
          className="w-fit rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-500/10"
        >
          {isDisconnecting ? "Déconnexion…" : "Déconnecter"}
        </button>
      )}

      {summary?.tokenExpiresAt && state === "connected" && (
        <p className="text-[11px] text-muted-foreground ">
          Jeton valide jusqu&apos;au {new Date(summary.tokenExpiresAt).toLocaleString("fr-FR")}.
        </p>
      )}

      {state === "connected" && !isLinkedInOrganizationAccount(account.externalAccountId) && (
        <>
          {ORGANIZATION_SCOPES.every((scope) => (summary?.scopes ?? []).includes(scope)) ? (
            <LinkedInOrganizationsPanel adminAccountId={account.id} brandId={account.brandId} />
          ) : (
            account.brandId && (
              <a
                href={`/api/social/linkedin/connect?brandId=${encodeURIComponent(account.brandId)}&includeOrganization=true`}
                className="w-fit text-[11px] font-medium text-violet-700 hover:underline dark:text-violet-300"
              >
                Autoriser aussi la publication sur une Page LinkedIn administrée
              </a>
            )
          )}
        </>
      )}

      {error && <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
