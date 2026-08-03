/**
 * État de connexion OAuth détaillé — plus fin que `AccountStatus` (types/dashboard.ts, qui reste
 * la valeur persistée et affichée dans le reste de l'application). Calculé à la volée par
 * `computeLinkedInConnectionState()` à partir de faits vérifiables (compte local, expiration du
 * jeton, dernier résultat d'appel), jamais stocké tel quel — jamais optimiste par défaut.
 */
export type OAuthConnectionState =
  | "not_configured" // Aucune application LinkedIn configurée côté serveur (variables absentes).
  | "no_local_account" // Aucun compte affilié LinkedIn créé pour cette marque.
  | "local_profile_only" // Compte affilié configuré localement (profile_only) — OAuth jamais lancé.
  | "authorization_pending" // Redirection vers LinkedIn en cours — état local/transitoire, jamais persisté en base.
  | "connected" // Jeton valide, aucun problème connu.
  | "token_expired" // Jeton expiré — reconnexion nécessaire (pas de rafraîchissement silencieux automatique sans confirmation).
  | "insufficient_permission" // Connecté, mais sans la portée nécessaire pour l'action demandée.
  | "disconnected" // Déconnecté explicitement par un administrateur du workspace.
  | "temporary_error" // Dernier appel LinkedIn en échec transitoire (réseau, 5xx, délai).
  | "persistent_error"; // Dernier appel LinkedIn en échec définitif confirmé (hors permission, ex. compte LinkedIn désactivé).

export const OAUTH_CONNECTION_STATE_LABEL: Record<OAuthConnectionState, string> = {
  not_configured: "Intégration non configurée",
  no_local_account: "Aucun compte configuré",
  local_profile_only: "Profil renseigné — non connecté",
  authorization_pending: "Autorisation en attente",
  connected: "Connecté",
  token_expired: "Jeton expiré",
  insufficient_permission: "Permission insuffisante",
  disconnected: "Déconnecté",
  temporary_error: "Erreur temporaire",
  persistent_error: "Erreur persistante",
};

export interface OAuthConnectionSummary {
  state: OAuthConnectionState;
  /** Portées réellement accordées par LinkedIn — jamais devinées, toujours celles renvoyées par
   * l'échange de jeton ou son rafraîchissement. */
  scopes: string[];
  tokenExpiresAt: string | null;
  lastCheckedAt: string | null;
  externalAccountId: string | null;
  message?: string;
}
