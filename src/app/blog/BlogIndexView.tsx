"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ComponentType, SVGProps } from "react";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { SectionEyebrow } from "@/components/marketing/SectionEyebrow";
import {
  IconCalendar,
  IconChartBar,
  IconClipboardCheck,
  IconSparkles,
  IconTrendingUp,
  IconUsers,
  IconWand,
} from "@/components/icons";
import { useLocale } from "@/lib/i18n/locale-provider";
import { getBlogPosts, type BlogCategory } from "@/lib/marketing/blog-posts";

const CATEGORIES: BlogCategory[] = ["strategy", "social", "creation", "calendar", "ai", "productivity", "marketing"];

const CATEGORY_ICON: Record<BlogCategory, ComponentType<SVGProps<SVGSVGElement>>> = {
  strategy: IconTrendingUp,
  social: IconUsers,
  creation: IconWand,
  calendar: IconCalendar,
  ai: IconSparkles,
  productivity: IconClipboardCheck,
  marketing: IconChartBar,
};

const CATEGORY_TONE: Record<BlogCategory, string> = {
  strategy: "from-violet-600 to-blue-600",
  social: "from-fuchsia-600 to-rose-500",
  creation: "from-violet-600 to-fuchsia-600",
  calendar: "from-blue-600 to-violet-600",
  ai: "from-fuchsia-600 to-violet-600",
  productivity: "from-emerald-500 to-blue-600",
  marketing: "from-rose-500 to-fuchsia-600",
};

const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();
function formatDate(iso: string, locale: string): string {
  if (!dateFormatterCache.has(locale)) {
    dateFormatterCache.set(locale, new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", { day: "numeric", month: "long", year: "numeric" }));
  }
  return dateFormatterCache.get(locale)!.format(new Date(iso));
}

export function BlogIndexView() {
  const { locale, t } = useLocale();
  const posts = useMemo(() => getBlogPosts(locale), [locale]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<BlogCategory | "all">("all");

  const featured = posts.find((post) => post.featured) ?? posts[0];
  const rest = posts.filter((post) => post.slug !== featured?.slug);

  const filtered = rest.filter((post) => {
    if (category !== "all" && post.category !== category) return false;
    if (search.trim().length === 0) return true;
    const query = search.trim().toLowerCase();
    return post.title.toLowerCase().includes(query) || post.excerpt.toLowerCase().includes(query);
  });

  return (
    <MarketingShell>
      <section className="relative overflow-hidden border-b border-border px-6 py-16 sm:py-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-80 [background:radial-gradient(900px_450px_at_50%_-10%,rgba(124,58,237,0.16),transparent_60%)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center gap-4 text-center">
          <SectionEyebrow>{t("blog.eyebrow")}</SectionEyebrow>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t("blog.title")}</h1>
          <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">{t("blog.subtitle")}</p>
        </div>
      </section>

      {featured && (
        <section className="border-b border-border px-6 py-10">
          <div className="mx-auto w-full max-w-5xl">
            <Link
              href={`/blog/${featured.slug}`}
              className="grid grid-cols-1 gap-6 rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-violet-300 dark:hover:border-violet-500/40 sm:grid-cols-[1fr_1.2fr] sm:p-8"
            >
              <div className={`relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${CATEGORY_TONE[featured.category]}`}>
                <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-xl" />
                {(() => {
                  const FeaturedIcon = CATEGORY_ICON[featured.category];
                  return <FeaturedIcon className="relative h-14 w-14 text-white/85" />;
                })()}
              </div>
              <div className="flex flex-col justify-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-fit rounded-full bg-violet-600 px-2.5 py-1 text-[11px] font-semibold text-white">{t("blog.featuredLabel")}</span>
                  <span className="w-fit rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">{t("blog.placeholderBadge")}</span>
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">{featured.title}</h2>
                <p className="text-sm text-muted-foreground">{featured.excerpt}</p>
                <span className="text-xs text-muted-foreground">
                  {t("blog.byAuthorPrefix")} {featured.author} · {formatDate(featured.publishedAt, locale)} · {featured.readingMinutes} {t("blog.minutesReadingSuffix")}
                </span>
              </div>
            </Link>
          </div>
        </section>
      )}

      <section className="px-6 py-12">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("blog.searchPlaceholder")}
              className="w-full max-w-sm rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategory("all")}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  category === "all" ? "bg-violet-600 text-white" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("blog.allCategories")}
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    category === cat ? "bg-violet-600 text-white" : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t(`blog.category.${cat}`)}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">{t("blog.emptyState")}</p>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-violet-300 dark:hover:border-violet-500/40"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-fit rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-400">
                      {t(`blog.category.${post.category}`)}
                    </span>
                    <span className="w-fit rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{t("blog.placeholderBadge")}</span>
                  </div>
                  <h3 className="text-base font-semibold">{post.title}</h3>
                  <p className="line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>
                  <span className="mt-auto text-xs text-muted-foreground">
                    {formatDate(post.publishedAt, locale)} · {post.readingMinutes} {t("blog.minutesReadingSuffix")}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </MarketingShell>
  );
}
