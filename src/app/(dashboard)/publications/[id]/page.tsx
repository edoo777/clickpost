import { PublicationView } from "@/components/publications/PublicationView";

interface PublicationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PublicationDetailPage({ params }: PublicationDetailPageProps) {
  const { id } = await params;
  return <PublicationView mode="edit" id={id} />;
}
