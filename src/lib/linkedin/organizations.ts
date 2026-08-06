import { getLinkedInConfig } from "@/lib/linkedin/config";

/**
 * Liste des organisations (Pages LinkedIn) que le membre administre — nécessite la portée
 * `r_organization_admin` (Phase 4, jamais accordée par défaut, voir
 * isLinkedInOrganizationAccessEnabled()). Endpoint documenté officiel :
 * GET /rest/organizationAcls?q=roleAssignee&role=ADMINISTRATOR — projection étendue pour obtenir
 * le nom lisible en un seul appel.
 *
 * NON TESTÉ EN CONDITIONS RÉELLES : aucun accès organisation n'a encore été approuvé par
 * LinkedIn pour ce projet au moment de l'écriture (voir docs/linkedin-production-readiness.md).
 * Implémenté à partir de la documentation officielle actuelle uniquement — à revérifier dès
 * qu'un accès réel est obtenu, avant toute utilisation en production.
 */
export interface AdministeredOrganization {
  organizationUrn: string;
  name: string;
  vanityName: string | null;
}

export type OrganizationsResult =
  | { ok: true; organizations: AdministeredOrganization[] }
  | { ok: false; status: number; message: string; isPermissionError: boolean };

export async function fetchAdministeredOrganizations(accessToken: string): Promise<OrganizationsResult> {
  const config = getLinkedInConfig();
  if (!config) return { ok: false, status: 503, message: "Intégration LinkedIn non configurée.", isPermissionError: false };

  const url = new URL("https://api.linkedin.com/rest/organizationAcls");
  url.searchParams.set("q", "roleAssignee");
  url.searchParams.set("role", "ADMINISTRATOR");
  url.searchParams.set("state", "APPROVED");
  url.searchParams.set("projection", "(elements*(organization~(localizedName,vanityName)))");

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "LinkedIn-Version": config.apiVersion,
        "X-Restli-Protocol-Version": "2.0.0",
      },
    });
  } catch {
    return { ok: false, status: 0, message: "LinkedIn injoignable (réseau).", isPermissionError: false };
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      message: `Impossible de récupérer les pages administrées (${response.status}).`,
      isPermissionError: response.status === 403,
    };
  }

  try {
    const data = (await response.json()) as {
      elements?: { organization: string; "organization~"?: { localizedName?: string; vanityName?: string } }[];
    };
    const organizations = (data.elements ?? []).map((element) => ({
      organizationUrn: element.organization,
      name: element["organization~"]?.localizedName ?? element.organization,
      vanityName: element["organization~"]?.vanityName ?? null,
    }));
    return { ok: true, organizations };
  } catch {
    return { ok: false, status: response.status, message: "Réponse LinkedIn inattendue (pages administrées).", isPermissionError: false };
  }
}

/** Vrai si un compte est une Page LinkedIn (organisation) plutôt qu'un profil personnel — dérivé
 * du préfixe de l'URN réel, jamais d'un champ séparé (aucune migration nécessaire). */
export function isLinkedInOrganizationAccount(externalAccountId: string | undefined): boolean {
  return Boolean(externalAccountId?.startsWith("urn:li:organization:"));
}
