import { notFound } from "next/navigation";
import { BlogArticleView } from "@/app/blog/[slug]/BlogArticleView";
import { getAllBlogSlugs, getBlogPost } from "@/lib/marketing/blog-posts";

interface BlogArticlePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: BlogArticlePageProps) {
  const { slug } = await params;
  const post = getBlogPost("fr", slug);
  if (!post) return { title: "Article introuvable — ClickPost" };
  return {
    title: `${post.title} — Blog ClickPost`,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, type: "article" },
  };
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = await params;
  if (!getBlogPost("fr", slug)) notFound();
  return <BlogArticleView slug={slug} />;
}
