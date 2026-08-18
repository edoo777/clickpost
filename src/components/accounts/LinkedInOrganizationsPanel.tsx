"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "@/lib/i18n/locale-provider";

interface AdministeredOrganization {
  organizationUrn: string;
  name: string;
  vanityName: string | null;
}

interface LinkedInOrganizationsPanelProps {
  adminAccountId: string;
  brandId?: string;
}

/**
 * Phase 4 — liste les Pages LinkedIn administrées par le compte personnel connecté et permet
 * d'en connecter une comme compte affilié distinct. Ne s'affiche (voir LinkedInConnectionPanel)
 * que si le compte personnel a déjà les portées organisation accordées — n'appelle donc jamais
 * cette route pour un compte qui ne les a pas.
 */
export function LinkedInOrganizationsPanel({ adminAccountId, brandId }: LinkedInOrganizationsPanelProps) {
  const t = useTranslations();
  const [organizations, setOrganizations] = useState<AdministeredOrganization[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectingUrn, setConnectingUrn] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/social/linkedin/organizations?accountId=${encodeURIComponent(adminAccountId)}`)
      .then((response) => response.json())
      .then((body: { status: string; organizations?: AdministeredOrganization[]; message?: string }) => {
        if (cancelled) return;
        if (body.status === "ok" && body.organizations) setOrganizations(body.organizations);
        else setError(body.message ?? t("accounts.linkedinOrganizations.unavailable"));
      })
      .catch(() => {
        if (!cancelled) setError(t("accounts.linkedinOrganizations.unavailableNetwork"));
      });
    return () => {
      cancelled = true;
    };
    // `t` volontairement exclu : ne re-déclencherait qu'un appel réseau superflu à chaque
    // changement de langue, jamais une donnée obsolète affichée après un changement de langue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminAccountId]);

  async function handleConnect(org: AdministeredOrganization) {
    if (connectingUrn) return; // empêche les doubles clics.
    setConnectingUrn(org.organizationUrn);
    setError(null);
    try {
      const response = await fetch("/api/social/linkedin/connect-organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminAccountId, brandId, organizationUrn: org.organizationUrn, organizationName: org.name }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        setError(body?.message ?? t("accounts.linkedinOrganizations.connectFailed"));
        return;
      }
      // La nouvelle page a été créée côté serveur, hors du magasin local synchronisé habituel
      // (même principe que le retour de callback OAuth) — un rechargement complet la fait
      // apparaître via le pull normal au démarrage, plutôt qu'une logique de fusion ad hoc ici.
      window.location.reload();
    } catch {
      setError(t("accounts.linkedinOrganizations.connectFailedNetwork"));
    } finally {
      setConnectingUrn(null);
    }
  }

  if (error) return <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>;
  if (!organizations) return <p className="text-[11px] text-muted-foreground">{t("accounts.linkedinOrganizations.searching")}</p>;
  if (organizations.length === 0) {
    return <p className="text-[11px] text-muted-foreground">{t("accounts.linkedinOrganizations.noneFound")}</p>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">{t("accounts.linkedinOrganizations.title")}</span>
      {organizations.map((org) => (
        <div key={org.organizationUrn} className="flex items-center justify-between gap-2 rounded-md bg-white px-2 py-1.5 text-xs dark:bg-zinc-900">
          <span className="text-zinc-700 dark:text-zinc-300">{org.name}</span>
          <button
            type="button"
            onClick={() => void handleConnect(org)}
            disabled={connectingUrn === org.organizationUrn}
            className="rounded-md border border-border px-2 py-1 text-[11px] font-medium text-violet-700 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-violet-300 dark:hover:bg-violet-500/10"
          >
            {connectingUrn === org.organizationUrn ? t("accounts.linkedinOrganizations.connecting") : t("accounts.linkedinOrganizations.connectButton")}
          </button>
        </div>
      ))}
    </div>
  );
}
