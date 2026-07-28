import { Suspense } from "react";
import { IdeaWorkshopView } from "@/components/idea-workshop/IdeaWorkshopView";

interface IdeaWorkshopPageProps {
  params: Promise<{ id: string }>;
}

export default async function IdeaWorkshopPage({ params }: IdeaWorkshopPageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <IdeaWorkshopView ideaId={id} />
    </Suspense>
  );
}
