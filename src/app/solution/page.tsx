import { SolutionView } from "@/app/solution/SolutionView";

export const metadata = {
  title: "Solution — ClickPost",
  description: "Découvrez comment ClickPost transforme votre production de contenu : capturer, générer, créer, organiser, planifier, publier, mesurer.",
  openGraph: {
    title: "La solution ClickPost",
    description: "De l'idée à la publication, un seul espace de travail.",
    type: "website",
  },
};

export default function SolutionPage() {
  return <SolutionView />;
}
