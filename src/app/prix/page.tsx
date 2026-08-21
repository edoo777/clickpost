import { PrixView } from "@/app/prix/PrixView";

export const metadata = {
  title: "Prix — ClickPost",
  description: "Des plans simples qui grandissent avec vous : marques, comptes sociaux, générations IA, calendrier intelligent, banque d'idées et analytics.",
  openGraph: {
    title: "Tarifs ClickPost",
    description: "Une offre simple, qui grandit avec vous.",
    type: "website",
  },
};

export default function PrixPage() {
  return <PrixView />;
}
