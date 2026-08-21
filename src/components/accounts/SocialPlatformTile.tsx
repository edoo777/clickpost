"use client";

import { useEffect, useState } from "react";
import { platformIcons } from "@/components/icons";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { platformColors } from "@/lib/platform-colors";
import { usePlatformLabel } from "@/lib/post-status";
import { OAUTH_CONNECTION_STATE_LABEL, type OAuthConnectionSummary } from "@/types/oauth-connection";
import type { SocialAccount, SocialPlatform } from "@/types/dashboard";

/** Les six plateformes gérées par ce panneau — chacune expose exactement le même contrat de
 * routes serveur (`/api/social/<plateforme>/{status,connect,disconnect}`), voir
 * src/lib/publishing/providers.ts pour la liste des fournisseurs réellement branchés. Threads,
 * Pinterest et "other" n'ont aucun fournisseur réel et restent hors de cette vue. */
export const MANAGED_SOCIAL_PLATFORMS: SocialPlatform[] = ["linkedin", "instagram", "facebook", "tiktok", "x", "youtube"];

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

interface SocialPlatformTileProps {
  platform: SocialPlatform;
  brandId: string;
  /** Compte local déjà connu pour cette marque et cette plateforme, s'il existe — jamais requis
   * pour afficher la tuile ni pour proposer « Connecter » : la route `/connect` crée elle-même le
   * compte lors du retour OAuth (voir le callback correspondant), exactement comme LinkedIn. */
  account: SocialAccount | undefined;
  onDisconnected: (accountId: string) => void;
  onOpenDetails: (accountId: string) => void;
}

/**
 * Tuile de connexion générique — LinkedIn, Instagram, Facebook, TikTok, X, YouTube, toutes via le
 * même contrat de routes. Interroge `/api/social/<plateforme>/status` côté serveur (seule route
 * qui connaît réellement l'état de configuration, dépendant de variables d'environnement
 * serveur) : ne devine jamais l'état de connexion depuis le seul navigateur, et n'affiche jamais
 * "connecté" sans confirmation réelle. Logo et couleur réutilisent exactement
 * `platformIcons`/`platformColors`, déjà utilisés partout ailleurs dans l'application (AccountCard,
 * PublicationCard, etc.) — même design, aucun style nouveau introduit.
 */
export function SocialPlatformTile({ platform, brandId, account, onDisconnected, onOpenDetails }: SocialPlatformTileProps) {
  const t = useTranslations();
  const PLATFORM_LABEL = usePlatformLabel();
  const Icon = platformIcons[platform];
  const color = platformColors[platform];
  const [summary, setSummary] = useState<OAuthConnectionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (cancelled) return;
      setIsLoading(true);
      const query = account ? `?accountId=${encodeURIComponent(account.id)}` : "";
      fetch(`/api/social/${platform}/status${query}`)
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
    // superflu à chaque changement de langue, jamais une donnée obsolète affichée après un
    // changement de langue (le message d'erreur n'apparaît que si CET appel échoue).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform, account?.id]);

  async function handleDisconnect() {
    if (!account || isDisconnecting) return; // empêche les doubles clics.
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
      onDisconnected(account.id);
    } catch {
      setError(t("accounts.socialConnection.disconnectFailedNetwork"));
    } finally {
      setIsDisconnecting(false);
    }
  }

  const state = summary?.state ?? "no_local_account";
  const tone = STATE_TONE[state];
  const connectUrl = `/api/social/${platform}/connect?brandId=${encodeURIComponent(brandId)}`;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${color.bg}`}>
            <Icon className={`h-4 w-4 ${color.text}`} />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground ">{PLATFORM_LABEL[platform]}</span>
            {account?.status === "connected" && (account.handle || account.accountName) && (
              <span className="truncate text-xs text-muted-foreground ">{account.handle || account.accountName}</span>
            )}
          </div>
        </div>
        {isLoading ? (
          <span className="shrink-0 text-[11px] text-muted-foreground ">{t("accounts.socialConnection.checkingConnectionShort")}</span>
        ) : (
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${TONE_CLASS[tone]}`}>{OAUTH_CONNECTION_STATE_LABEL[state]}</span>
        )}
      </div>

      {!isLoading && (
        <div className="flex flex-wrap items-center gap-2">
          {state === "not_configured" && (
            <p className="text-xs text-muted-foreground ">
              {t("accounts.socialConnection.notConfiguredNotice", { platform: PLATFORM_LABEL[platform] })}
            </p>
          )}

          {(state === "no_local_account" || state === "local_profile_only" || state === "disconnected") && (
            <a
              href={connectUrl}
              className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-fuchsia-500/20"
            >
              {t("accounts.socialConnection.connectButton", { platform: PLATFORM_LABEL[platform] })}
            </a>
          )}

          {(state === "token_expired" || state === "insufficient_permission") && (
            <a href={connectUrl} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {t("accounts.socialConnection.reconnectButton", { platform: PLATFORM_LABEL[platform] })}
            </a>
          )}

          {(state === "connected" || state === "token_expired" || state === "insufficient_permission") && account && (
            <button
              type="button"
              onClick={() => void handleDisconnect()}
              disabled={isDisconnecting}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-500/10"
            >
              {isDisconnecting ? t("accounts.socialConnection.disconnecting") : t("accounts.socialConnection.disconnectButton")}
            </button>
          )}

          {account && (
            <button
              type="button"
              onClick={() => onOpenDetails(account.id)}
              className="text-xs font-medium text-violet-700 hover:underline dark:text-violet-300"
            >
              {t("accounts.socialConnection.detailsLink")}
            </button>
          )}
        </div>
      )}

      {state === "insufficient_permission" && summary?.message && (
        <p className="text-xs text-amber-700 dark:text-amber-400">{summary.message}</p>
      )}

      {error && <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
