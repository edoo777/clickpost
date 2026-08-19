import { ConditionsView } from "@/app/conditions/ConditionsView";

export const metadata = { title: "Conditions d'utilisation — ClickPost" };

// Composant serveur minimal : `metadata` n'est exportable que depuis un Server Component ; le
// contenu réel (traduit FR/EN, voir src/lib/i18n/) vit dans ConditionsView, un composant client.
export default function ConditionsPage() {
  return <ConditionsView />;
}
