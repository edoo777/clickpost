const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export function validateEmail(email: string): string | null {
  if (!email.trim()) return "L'adresse courriel est requise.";
  if (!EMAIL_PATTERN.test(email.trim())) return "Adresse courriel invalide.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Le mot de passe est requis.";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`;
  }
  return null;
}

export function validatePasswordsMatch(password: string, confirmation: string): string | null {
  if (password !== confirmation) return "Les mots de passe ne correspondent pas.";
  return null;
}

export function validateRequired(value: string, label: string): string | null {
  if (!value.trim()) return `${label} est requis.`;
  return null;
}
