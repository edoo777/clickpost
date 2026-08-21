import type { TranslationKey } from "@/lib/i18n/locale-provider";
import type { SocialPlatform } from "@/types/dashboard";

/**
 * Les six plateformes dont le callback OAuth redirige vers `/comptes` avec `?<plateforme>_error=`
 * ou `?<plateforme>_connected=` (voir `src/app/api/social/<plateforme>/callback/route.ts`) —
 * lues par `AccountsListView.tsx` pour afficher un message propre, jamais une redirection muette.
 */
export const OAUTH_CALLBACK_PLATFORMS: SocialPlatform[] = ["linkedin", "instagram", "facebook", "tiktok", "x", "youtube"];

type TFunction = (key: TranslationKey, vars?: Record<string, string | number>) => string;

/** Traduit un code d'erreur de callback OAuth en message utilisateur propre — jamais le code brut
 * affiché tel quel à l'utilisateur (voir la clé `errorGeneric` en repli pour un code non prévu
 * ci-dessous, ex. une catégorie ajoutée plus tard côté fournisseur). `ref` (identifiant de
 * corrélation) n'est ajouté que pour les échecs d'échange de jeton, seul cas où le journal serveur
 * (jamais affiché ici) peut être retrouvé via cette référence. */
export function describeOAuthCallbackError(t: TFunction, platform: string, code: string, ref: string | null): string {
  switch (code) {
    case "consent_denied":
      return t("accounts.oauthCallback.errorConsentDenied", { platform });
    case "missing_params":
      return t("accounts.oauthCallback.errorMissingParams", { platform });
    case "invalid_state_malformed":
    case "invalid_state_invalid_signature":
    case "invalid_state_expired":
    case "invalid_state_not_configured":
      return t("accounts.oauthCallback.errorInvalidState", { platform });
    case "session_mismatch":
      return t("accounts.oauthCallback.errorSessionMismatch", { platform });
    case "forbidden":
      return t("accounts.oauthCallback.errorForbidden", { platform });
    case "token_exchange_failed":
      return ref
        ? t("accounts.oauthCallback.errorTokenExchangeFailedRef", { platform, ref })
        : t("accounts.oauthCallback.errorTokenExchangeFailed", { platform });
    case "identity_fetch_failed":
      return t("accounts.oauthCallback.errorIdentityFetchFailed", { platform });
    case "account_save_failed":
      return t("accounts.oauthCallback.errorAccountSaveFailed", { platform });
    case "token_storage_failed":
      return t("accounts.oauthCallback.errorTokenStorageFailed", { platform });
    case "not_configured":
      return t("accounts.oauthCallback.errorNotConfigured", { platform });
    case "missing_brand":
      return t("accounts.oauthCallback.errorMissingBrand", { platform });
    case "brand_not_found":
      return t("accounts.oauthCallback.errorBrandNotFound", { platform });
    case "missing_code_verifier":
      return t("accounts.oauthCallback.errorMissingCodeVerifier", { platform });
    case "missing_refresh_token":
      return t("accounts.oauthCallback.errorMissingRefreshToken", { platform });
    case "no_instagram_account":
      return t("accounts.oauthCallback.errorNoInstagramAccount");
    case "no_page":
      return t("accounts.oauthCallback.errorNoPage");
    case "pages_fetch_failed":
      return t("accounts.oauthCallback.errorPagesFetchFailed", { platform });
    default:
      return t("accounts.oauthCallback.errorGeneric", { platform, code });
  }
}
