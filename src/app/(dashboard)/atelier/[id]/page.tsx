import { IdeaWorkshopView } from "@/components/idea-workshop/IdeaWorkshopView";

interface IdeaWorkshopPageProps {
  params: Promise<{ id: string }>;
}

export default async function IdeaWorkshopPage({ params }: IdeaWorkshopPageProps) {
  const { id } = await params;
  return <IdeaWorkshopView ideaId={id} />;
}
