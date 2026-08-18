"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { isSupportedLocale } from "@/lib/i18n/locale";
import { useWorkspaceSession } from "@/lib/supabase/workspace-provider";

/**
 * Aligne la langue de l'interface sur `profiles.ui_locale` dès que le profil authentifié est
 * connu — une fois connecté, la préférence enregistrée sur le compte fait toujours foi (au-delà
 * du cookie local, utile en particulier sur un nouvel appareil). Ne fait rien pour un visiteur non
 * connecté (landing page, connexion/inscription) : le cookie/localStorage reste la seule source.
 * Ne s'applique qu'une fois par chargement de profil pour ne jamais écraser un changement fait par
 * l'utilisateur dans la même session via LanguageSwitcher.
 */
export function LocaleProfileSync() {
  const { profile } = useWorkspaceSession();
  const { setLocale } = useLocale();
  const appliedForProfileId = useRef<string | null>(null);

  useEffect(() => {
    if (!profile || appliedForProfileId.current === profile.id) return;
    appliedForProfileId.current = profile.id;
    if (isSupportedLocale(profile.ui_locale)) setLocale(profile.ui_locale);
  }, [profile, setLocale]);

  return null;
}
