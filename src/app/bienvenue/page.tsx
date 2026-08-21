import { BienvenueView } from "@/app/bienvenue/BienvenueView";

export const metadata = {
  title: "ClickPost — Le calendrier de publication intelligent du créateur",
  description:
    "ClickPost centralise vos idées, votre calendrier éditorial, votre production de contenu et vos publications sociales dans un seul espace de travail intelligent.",
  openGraph: {
    title: "ClickPost — Le calendrier de publication intelligent du créateur",
    description: "Fini Excel. Planifiez, créez et publiez tout votre contenu depuis un seul espace de travail.",
    type: "website",
  },
};

// Composant serveur minimal : `metadata` n'est exportable que depuis un Server Component ; le
// contenu réel (traduit FR/EN, voir src/lib/i18n/) vit dans BienvenueView, un composant client.
// Les tarifs réels (table `plans`) sont désormais présentés sur /prix, pas sur cette page.
export default function BienvenuePage() {
  return <BienvenueView />;
}
