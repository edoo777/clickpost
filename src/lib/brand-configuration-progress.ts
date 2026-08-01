import type { Brand } from "@/types/brand";
import type { SocialAccount } from "@/types/dashboard";
import type { Theme } from "@/types/theme";

export interface ConfigurationStep {
  key: string;
  label: string;
  done: boolean;
}

function accountBelongsToBrand(account: SocialAccount, brand: Brand): boolean {
  return account.brandId ? account.brandId === brand.id : account.brand === brand.name;
}

/** Indicateur de progression affiché dans la fiche de marque — distinct de
 * `getBrandCompleteness` (qui mesure le remplissage du formulaire) : ici, ce qui est
 * nécessaire pour que la marque soit réellement utilisable par le Générateur d'idées. */
export function getBrandConfigurationProgress(brand: Brand, accounts: SocialAccount[], themes: Theme[]): ConfigurationStep[] {
  const brandAccounts = accounts.filter((account) => accountBelongsToBrand(account, brand));
  const brandThemes = themes.filter((theme) => theme.brandId === brand.id);

  const identityDone = Boolean(brand.name.trim() && brand.description.trim());
  const nicheDone = Boolean(brand.industry.trim());
  const accountsDone = brandAccounts.length > 0;
  const themesDone = brandThemes.some((theme) => theme.active);

  const steps: ConfigurationStep[] = [
    { key: "identity", label: "Identité complétée", done: identityDone },
    { key: "niche", label: "Niche définie", done: nicheDone },
    { key: "accounts", label: "Comptes ajoutés", done: accountsDone },
    { key: "themes", label: "Thématiques ajoutées", done: themesDone },
  ];
  steps.push({ key: "ready", label: "Prête pour la génération", done: steps.every((step) => step.done) });
  return steps;
}
