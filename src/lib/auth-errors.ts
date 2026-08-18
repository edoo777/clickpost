import type { TranslationKey } from "@/lib/i18n/locale-provider";

const KNOWN_MESSAGES: Record<string, TranslationKey> = {
  "Invalid login credentials": "auth.errors.invalidCredentials",
  "User already registered": "auth.errors.userAlreadyRegistered",
  "Email not confirmed": "auth.errors.emailNotConfirmed",
  "Password should be at least 6 characters": "auth.validation.passwordTooShort",
  "Password should be at least 8 characters": "auth.validation.passwordTooShort",
  "Auth session missing!": "auth.errors.sessionExpired",
  "New password should be different from the old password.": "auth.errors.samePassword",
  "Signup requires a valid password": "auth.errors.invalidPassword",
  "Unable to validate email address: invalid format": "auth.errors.invalidEmailFormat",
  "For security purposes, you can only request this after some time.": "auth.errors.rateLimited",
};

/** Traduit les messages d'erreur Supabase Auth connus en clé de dictionnaire i18n ; renvoie une
 * clé générique pour les messages non reconnus (jamais le message anglais brut de Supabase). */
export function translateAuthError(message: string | undefined | null): TranslationKey {
  if (!message) return "auth.errors.unknown";
  return KNOWN_MESSAGES[message] ?? "auth.errors.unknown";
}
