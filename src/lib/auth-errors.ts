const KNOWN_MESSAGES: Record<string, string> = {
  "Invalid login credentials": "Adresse courriel ou mot de passe incorrect.",
  "User already registered": "Un compte existe déjà avec cette adresse courriel.",
  "Email not confirmed": "Veuillez confirmer votre adresse courriel avant de vous connecter.",
  "Password should be at least 6 characters": "Le mot de passe doit contenir au moins 6 caractères.",
  "Password should be at least 8 characters": "Le mot de passe doit contenir au moins 8 caractères.",
  "Auth session missing!": "Votre session a expiré. Merci de recommencer.",
  "New password should be different from the old password.":
    "Le nouveau mot de passe doit être différent de l'ancien.",
  "Signup requires a valid password": "Veuillez saisir un mot de passe valide.",
  "Unable to validate email address: invalid format": "Adresse courriel invalide.",
  "For security purposes, you can only request this after some time.":
    "Pour des raisons de sécurité, veuillez patienter avant de réessayer.",
};

/** Traduit les messages d'erreur Supabase Auth connus en français ; laisse passer les autres tels quels. */
export function translateAuthError(message: string | undefined | null): string {
  if (!message) return "Une erreur inattendue est survenue. Veuillez réessayer.";
  return KNOWN_MESSAGES[message] ?? message;
}
