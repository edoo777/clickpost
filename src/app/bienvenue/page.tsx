import { BienvenueView } from "@/app/bienvenue/BienvenueView";

export const metadata = {
  title: "ClickPost — Stratégie, contenu IA et publication social media",
  description:
    "ClickPost centralise la stratégie éditoriale, la génération de contenu par IA, la planification, la publication et les rapports de performance, pour une ou plusieurs marques.",
};

// Composant serveur minimal : `metadata` n'est exportable que depuis un Server Component ; le
// contenu réel (traduit FR/EN, voir src/lib/i18n/) vit dans BienvenueView, un composant client.
export default function BienvenuePage() {
  return <BienvenueView />;
}
