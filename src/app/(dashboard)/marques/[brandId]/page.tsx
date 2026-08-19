"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { BrandProfileView } from "@/components/brands/BrandProfileView";
import { useBrandsSession } from "@/lib/brands-store";
import { useTranslations } from "@/lib/i18n/locale-provider";

export default function BrandDetailPage() {
  const t = useTranslations();
  const params = useParams<{ brandId: string }>();
  const { brands } = useBrandsSession();
  const brand = brands.find((candidate) => candidate.id === params.brandId);

  if (!brand) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-surface px-6 py-16 text-center dark:border-white/[.16] ">
        <p className="text-base font-semibold text-foreground ">{t("brands.detailPage.notFoundTitle")}</p>
        <p className="max-w-sm text-sm text-muted-foreground ">
          {t("brands.detailPage.notFoundDescription")}
        </p>
        <Link
          href="/marques"
          className="mt-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
        >
          {t("brands.detailPage.backToBrands")}
        </Link>
      </div>
    );
  }

  return <BrandProfileView brand={brand} />;
}
