import { CookiesView } from "@/app/cookies/CookiesView";

export const metadata = { title: "Cookies — ClickPost" };

// Composant serveur minimal : `metadata` n'est exportable que depuis un Server Component ; le
// contenu réel (traduit FR/EN, voir src/lib/i18n/) vit dans CookiesView, un composant client.
// Même patron que /conditions et /confidentialite.
export default function CookiesPage() {
  return <CookiesView />;
}
