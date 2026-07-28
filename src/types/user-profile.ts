import type { NotificationKey } from "@/types/settings";

export type DisplayDensity = "comfortable" | "compact";

/**
 * Le thème clair/sombre/système vit désormais dans le ThemeProvider global (src/lib/theme-store.tsx),
 * seule source de vérité pour toute l'application — il n'est plus dupliqué ici.
 */
export interface UserProfileExtra {
  memberId: string;
  firstName: string;
  lastName: string;
  company: string;
  timeZone: string;
  language: string;
  country: string;
  phone: string;
  bio: string;
  notifications: Record<NotificationKey, boolean>;
  displayDensity: DisplayDensity;
}
