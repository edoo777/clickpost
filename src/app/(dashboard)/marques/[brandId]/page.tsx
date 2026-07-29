"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { BrandProfileView } from "@/components/brands/BrandProfileView";
import { useBrandsSession } from "@/lib/brands-store";

export default function BrandDetailPage() {
  const params = useParams<{ brandId: string }>();
  const { brands } = useBrandsSession();
  const brand = brands.find((candidate) => candidate.id === params.brandId);

  if (!brand) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-surface px-6 py-16 text-center dark:border-white/[.16] ">
        <p className="text-base font-semibold text-foreground ">Marque introuvable</p>
        <p className="max-w-sm text-sm text-muted-foreground ">
          Cette marque n&apos;existe pas ou plus dans ce workspace.
        </p>
        <Link
          href="/marques"
          className="mt-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
        >
          Retour aux marques
        </Link>
      </div>
    );
  }

  return <BrandProfileView brand={brand} />;
}
