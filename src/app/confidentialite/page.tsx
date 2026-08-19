import { ConfidentialiteView } from "@/app/confidentialite/ConfidentialiteView";

export const metadata = { title: "Confidentialité — ClickPost" };

// Composant serveur minimal : `metadata` n'est exportable que depuis un Server Component ; le
// contenu réel (traduit FR/EN, voir src/lib/i18n/) vit dans ConfidentialiteView, un composant client.
export default function ConfidentialitePage() {
  return <ConfidentialiteView />;
}
