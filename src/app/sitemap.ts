import type { MetadataRoute } from "next";
import { getAllBlogSlugs } from "@/lib/marketing/blog-posts";
import { getSiteUrl } from "@/lib/marketing/site-url";

const STATIC_PATHS = ["/bienvenue", "/solution", "/prix", "/ressources", "/blog", "/contact", "/conditions", "/confidentialite", "/cookies"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path === "/blog" ? "weekly" : "monthly",
    priority: path === "/bienvenue" ? 1 : 0.7,
  }));
  const blogEntries: MetadataRoute.Sitemap = getAllBlogSlugs().map((slug) => ({
    url: `${base}/blog/${slug}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));
  return [...staticEntries, ...blogEntries];
}
