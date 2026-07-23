import { notFound } from "next/navigation";
import { BrandProfileView } from "@/components/brands/BrandProfileView";
import { brandProfiles } from "@/lib/brand-profiles";

interface BrandDetailPageProps {
  params: Promise<{ brandId: string }>;
}

export default async function BrandDetailPage({ params }: BrandDetailPageProps) {
  const { brandId } = await params;
  const profile = brandProfiles.find((candidate) => candidate.id === brandId);

  if (!profile) {
    notFound();
  }

  return <BrandProfileView profile={profile} />;
}
