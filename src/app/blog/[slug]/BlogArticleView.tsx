"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingButton } from "@/components/marketing/MarketingButton";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { useLocale } from "@/lib/i18n/locale-provider";
import { getBlogPost } from "@/lib/marketing/blog-posts";

export function BlogArticleView({ slug }: { slug: string }) {
  const { locale, t } = useLocale();
  const post = getBlogPost(locale, slug);
  if (!post) notFound();

  const dateFormatter = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", { day: "numeric", month: "long", year: "numeric" });

  return (
    <MarketingShell>
      <article className="px-6 py-16 sm:py-20">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
          <Link href="/blog" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            ← {t("blog.backToBlog")}
          </Link>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="w-fit rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-400">
                {t(`blog.category.${post.category}`)}
              </span>
              <span className="w-fit rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">{t("blog.placeholderBadge")}</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{post.title}</h1>
            <p className="text-sm text-muted-foreground">
              {t("blog.byAuthorPrefix")} {post.author} · {dateFormatter.format(new Date(post.publishedAt))} · {post.readingMinutes} {t("blog.minutesReadingSuffix")}
            </p>
          </div>

          <div className="flex aspect-[16/7] items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-5xl font-semibold text-violet-300 dark:from-violet-500/10 dark:to-fuchsia-500/10 dark:text-violet-500/40">
            CP
          </div>

          <div className="flex flex-col gap-5 text-base leading-relaxed text-foreground/90">
            {post.paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-border bg-muted/40 p-8 text-center">
            <p className="text-lg font-semibold">{t("landing.finalCta.title")}</p>
            <MarketingButton href="/inscription">{t("marketing.common.startFree")}</MarketingButton>
          </div>
        </div>
      </article>
    </MarketingShell>
  );
}
