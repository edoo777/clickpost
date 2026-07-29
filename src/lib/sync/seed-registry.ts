import { brandProfiles as SEED_BRANDS } from "@/lib/brand-profiles";
import { campaigns as SEED_CAMPAIGNS } from "@/lib/campaigns-data";
import { connectedAccounts as SEED_ACCOUNTS, posts as SEED_POSTS } from "@/lib/demo-data";
import { themes as SEED_THEMES } from "@/lib/themes-data";

/**
 * Registre centralisé et explicite des identifiants de données de démonstration —
 * calculé directement à partir des fichiers seed eux-mêmes (source unique de vérité,
 * jamais une liste recopiée à la main qui pourrait diverger). C'est le marqueur
 * fiable requis en remplacement d'une dépendance exclusive au format UUID : un
 * enregistrement est considéré comme seed si et seulement si son id figure ici,
 * quel que soit son format. Le format UUID v4 n'est plus qu'un filet de sécurité
 * secondaire (voir `is-user-created.ts`), jamais l'unique critère.
 *
 * Si une nouvelle source de données seed est ajoutée au projet, son tableau doit
 * être importé et fusionné ici pour rester couvert par l'exclusion.
 */
export const SEED_RECORD_IDS: ReadonlySet<string> = new Set([
  ...SEED_ACCOUNTS.map((account) => account.id),
  ...SEED_POSTS.map((post) => post.id),
  ...SEED_THEMES.map((theme) => theme.id),
  ...SEED_CAMPAIGNS.map((campaign) => campaign.id),
  ...SEED_BRANDS.map((brand) => brand.id),
]);

export function isSeedRecordId(id: string): boolean {
  return SEED_RECORD_IDS.has(id);
}
