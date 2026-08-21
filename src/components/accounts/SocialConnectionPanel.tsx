"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { usePlatformLabel } from "@/lib/post-status";
import { OAUTH_CONNECTION_STATE_LABEL, type OAuthConnectionSummary } from "@/types/oauth-connection";
import type { SocialAccount, SocialPlatform } from "@/types/dashboard";

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

/** Les cinq plateformes dont le fournisseur est réellement branché en dehors de LinkedIn (qui
 * garde son propre panneau, `LinkedInConnectionPanel.tsx`, jamais touché ici — voir le
 * commentaire de branchement dans `AccountDetailPanel.tsx`). */
export type WiredSocialPlatform = Exclude<SocialPlatform, "linkedin" | "threads" | "pinterest" | "other">;

interface SocialConnectionPanelProps {
  platform: WiredSocialPlatform;
  account: SocialAccount;
  onDisconnected: () => void;
}

/**
 * Panneau de connexion générique — Instagram, Facebook, TikTok, X, YouTube. Interroge
 * `/api/social/<plateforme>/status` côté serveur (seule route qui connaît réellement l'état de
 * configuration, dépendant de variables d'environnement serveur) : ne devine jamais l'état de
 * connexion depuis le seul navigateur. Structure identique à `LinkedInConnectionPanel.tsx`
 * (implémentation de référence), paramétrée par `platform` plutôt que dupliquée cinq fois.
 */
export function SocialConnectionPanel({ platform, account, onDisconnected }: SocialConnectionPanelProps) {
  const t = useTranslations();
  const PLATFORM_LABEL = usePlatformLabel();
  const [summary, setSummary] = useState<OAuthConnectionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (cancelled) return;
      setIsLoading(true);
      fetch(`/api/social/${platform}/status?accountId=${encodeURIComponent(account.id)}`)
        .then((response) => response.json())
        .then((body: { status: string; summary?: OAuthConnectionSummary }) => {
          if (cancelled) return;
          if (body.status === "ok" && body.summary) setSummary(body.summary);
        })
        .catch(() => {
          if (!cancelled) setError(t("accounts.socialConnection.statusUnavailable", { platform: PLATFORM_LABEL[platform] }));
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
    // `t`/`PLATFORM_LABEL` volontairement exclus : ne re-déclencheraient qu'un appel réseau
    // superflu à chaque changement de langue, pour un message qui n'est affiché que si CET appel
    // échoue — jamais une donnée obsolète affichée après un changement de langue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account.id, platform]);

  async function handleDisconnect() {
    if (isDisconnecting) return; // empêche les doubles clics.
    setIsDisconnecting(true);
    setError(null);
    try {
      const response = await fetch(`/api/social/${platform}/disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: account.id }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        setError(body?.message ?? t("accounts.socialConnection.disconnectFailed"));
        return;
      }
      onDisconnected();
    } catch {
      setError(t("accounts.socialConnection.disconnectFailedNetwork"));
    } finally {
      setIsDisconnecting(false);
    }
  }

  if (isLoading) {
    return <p className="text-xs text-muted-foreground ">{t("accounts.socialConnection.checkingConnection", { platform: PLATFORM_LABEL[platform] })}</p>;
  }

  const state = summary?.state ?? "no_local_account";
  const tone = STATE_TONE[state];
  const connectUrl = account.brandId ? `/api/social/${platform}/connect?brandId=${encodeURIComponent(account.brandId)}` : null;

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-zinc-100 p-3 dark:bg-zinc-800/60">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {t("accounts.socialConnection.title", { platform: PLATFORM_LABEL[platform] })}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${TONE_CLASS[tone]}`}>{OAUTH_CONNECTION_STATE_LABEL[state]}</span>
      </div>

      {state === "not_configured" && (
        <p className="text-xs text-muted-foreground ">
          {t("accounts.socialConnection.notConfiguredNotice", { platform: PLATFORM_LABEL[platform] })}
        </p>
      )}

      {(state === "no_local_account" || state === "local_profile_only" || state === "disconnected") && connectUrl && (
        <a
          href={connectUrl}
          className="w-fit rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-fuchsia-500/20"
        >
          {t("accounts.socialConnection.connectButton", { platform: PLATFORM_LABEL[platform] })}
        </a>
      )}

      {state === "token_expired" && connectUrl && (
        <a href={connectUrl} className="w-fit rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {t("accounts.socialConnection.reconnectButton", { platform: PLATFORM_LABEL[platform] })}
        </a>
      )}

      {state === "insufficient_permission" && (
        <>
          <p className="text-xs text-amber-700 dark:text-amber-400">{summary?.message ?? t("accounts.socialConnection.insufficientPermission")}</p>
          {connectUrl && (
            <a href={connectUrl} className="w-fit rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {t("accounts.socialConnection.reconnectButton", { platform: PLATFORM_LABEL[platform] })}
            </a>
          )}
        </>
      )}

      {(state === "connected" || state === "token_expired" || state === "insufficient_permission") && (
        <button
          type="button"
          onClick={() => void handleDisconnect()}
          disabled={isDisconnecting}
          className="w-fit rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-500/10"
        >
          {isDisconnecting ? t("accounts.socialConnection.disconnecting") : t("accounts.socialConnection.disconnectButton")}
        </button>
      )}

      {summary?.tokenExpiresAt && state === "connected" && (
        <p className="text-[11px] text-muted-foreground ">
          {t("accounts.socialConnection.tokenValidUntil", { date: new Date(summary.tokenExpiresAt).toLocaleString("fr-FR") })}
        </p>
      )}

      {error && <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
