import type { TranslationKey } from "@/lib/i18n/locale-provider";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export function validateEmail(email: string): TranslationKey | null {
  if (!email.trim()) return "auth.validation.emailRequired";
  if (!EMAIL_PATTERN.test(email.trim())) return "auth.validation.emailInvalid";
  return null;
}

export function validatePassword(password: string): TranslationKey | null {
  if (!password) return "auth.validation.passwordRequired";
  if (password.length < MIN_PASSWORD_LENGTH) return "auth.validation.passwordTooShort";
  return null;
}

export function validatePasswordsMatch(password: string, confirmation: string): TranslationKey | null {
  if (password !== confirmation) return "auth.validation.passwordsMismatch";
  return null;
}

export function validateRequired(value: string, key: "auth.validation.firstNameRequired" | "auth.validation.lastNameRequired"): TranslationKey | null {
  if (!value.trim()) return key;
  return null;
}
