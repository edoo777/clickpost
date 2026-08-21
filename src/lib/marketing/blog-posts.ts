import type { Locale } from "@/lib/i18n/locale";

export type BlogCategory = "strategy" | "social" | "creation" | "calendar" | "ai" | "productivity" | "marketing";

export interface BlogPost {
  slug: string;
  category: BlogCategory;
  title: string;
  excerpt: string;
  paragraphs: string[];
  author: string;
  publishedAt: string;
  readingMinutes: number;
  featured?: boolean;
}

/**
 * Articles de blog — CONTENU D'EXEMPLE volontairement en nombre réduit (voir le mandat : "ne pas
 * créer des dizaines de faux articles"), clairement identifié comme tel dans l'interface
 * (`blog.placeholderBadge`). Bilingue via le même `Locale` que le reste de l'application — stocké
 * ici plutôt que dans le dictionnaire i18n car un article est un contenu long-format, pas une
 * chaîne d'interface courte.
 */
const POSTS: Record<Locale, BlogPost[]> = {
  fr: [
    {
      slug: "calendrier-editorial-vs-excel",
      category: "calendar",
      title: "Pourquoi votre calendrier éditorial ne devrait plus vivre dans Excel",
      excerpt: "Un fichier Excel peut suivre vos publications, mais il ne vous aide jamais à en créer davantage. Voici ce qui change avec un calendrier pensé pour le contenu.",
      paragraphs: [
        "La plupart des créateurs et des équipes marketing commencent avec un tableur. C'est gratuit, familier, et ça fait le travail — jusqu'à ce que la stratégie grandisse au-delà de quelques colonnes.",
        "Le problème n'est pas Excel en soi : c'est qu'un tableur ne sait rien de votre contenu. Il ne relie pas une idée à son script, un script à sa date de publication, ni une publication à sa performance réelle. Chaque étape vit dans un outil différent, et c'est vous qui faites le pont, manuellement, chaque semaine.",
        "Un calendrier éditorial intelligent inverse ce rapport : l'idée, le contenu, la date, le réseau et le résultat vivent au même endroit, connectés. Vous ne perdez plus de temps à faire correspondre des fichiers entre eux — vous voyez directement où en est chaque publication, du premier sujet à la performance mesurée.",
        "Ce n'est pas une question d'outil à la mode : c'est une question de temps récupéré, chaque semaine, pour produire plutôt que pour organiser.",
      ],
      author: "Équipe ClickPost",
      publishedAt: "2026-02-03",
      readingMinutes: 4,
      featured: true,
    },
    {
      slug: "banque-idees-jamais-a-court",
      category: "strategy",
      title: "Comment ne plus jamais manquer d'idées de contenu",
      excerpt: "La panne d'inspiration n'est pas un problème de créativité — c'est un problème de système. Voici comment construire une réserve d'idées qui dure des mois.",
      paragraphs: [
        "Chercher une idée le jour même où vous devez publier est la source numéro un du contenu générique. Sous pression, on reproduit ce qui a déjà été fait, plutôt que d'explorer un angle nouveau.",
        "La solution n'est pas de forcer plus de créativité à la dernière minute — c'est de découpler la génération d'idées de la production. Réservez un moment dédié pour explorer un thème en profondeur et en sortir des dizaines de sujets d'un coup.",
        "Conservez-les ensuite dans une banque d'idées organisée par thématique, pas dans un document qui s'allonge sans structure. Quand vient le moment de produire, vous choisissez parmi des options déjà qualifiées, au lieu de partir d'une page blanche.",
      ],
      author: "Équipe ClickPost",
      publishedAt: "2026-01-22",
      readingMinutes: 3,
    },
    {
      slug: "ia-copilote-pas-generateur",
      category: "ai",
      title: "L'IA n'est pas un générateur de posts — c'est un copilote",
      excerpt: "Utiliser l'IA pour publier plus vite mène souvent à du contenu interchangeable. Utilisée comme copilote intégré à votre flux, elle produit l'inverse.",
      paragraphs: [
        "Beaucoup d'outils vendent l'IA comme un bouton magique : une idée entre, un post générique sort. Le résultat se sent rarement authentique, et finit souvent réécrit en entier avant publication.",
        "Une IA utile n'est pas celle qui remplace votre voix — c'est celle qui reste connectée à votre contexte réel : votre marque, votre calendrier, vos publications précédentes. Elle sert à développer une idée, reformuler un passage, ou proposer un hook, jamais à décider seule ce qui sera publié.",
        "L'objectif n'est pas de produire plus vite pour produire plus vite. C'est de rester dans son flux de travail — sans devoir ouvrir un onglet séparé, copier-coller, puis revenir — du premier sujet jusqu'à la publication planifiée.",
      ],
      author: "Équipe ClickPost",
      publishedAt: "2026-01-10",
      readingMinutes: 4,
    },
    {
      slug: "publier-regulierement-sans-epuisement",
      category: "productivity",
      title: "Publier régulièrement sans s'épuiser : ce qui fait vraiment la différence",
      excerpt: "La régularité ne vient pas de la motivation — elle vient d'un système qui rend chaque étape plus légère.",
      paragraphs: [
        "La régularité en contenu est souvent présentée comme une question de discipline. En réalité, c'est presque toujours une question de friction : plus il y a d'étapes manuelles entre une idée et une publication, plus il est facile d'abandonner en cours de route.",
        "Réduire cette friction ne veut pas dire produire moins de contenu — cela veut dire regrouper les étapes qui devraient naturellement aller ensemble : trouver l'idée, la développer, la planifier, la publier. Chaque outil supplémentaire dans la chaîne est une occasion de plus de tout laisser tomber une semaine chargée.",
        "Un espace de travail unique ne rend pas la créativité plus facile — mais il retire tout ce qui, autour d'elle, use l'énergie avant même d'avoir commencé à écrire.",
      ],
      author: "Équipe ClickPost",
      publishedAt: "2025-12-18",
      readingMinutes: 3,
    },
  ],
  en: [
    {
      slug: "calendrier-editorial-vs-excel",
      category: "calendar",
      title: "Why your editorial calendar shouldn't live in a spreadsheet anymore",
      excerpt: "A spreadsheet can track your publications, but it never helps you create more of them. Here's what changes with a calendar built for content.",
      paragraphs: [
        "Most creators and marketing teams start with a spreadsheet. It's free, familiar, and it gets the job done — until the strategy outgrows a handful of columns.",
        "The problem isn't the spreadsheet itself: it's that a spreadsheet knows nothing about your content. It doesn't connect an idea to its script, a script to its publish date, or a publication to its real performance. Each step lives in a different tool, and you're the one bridging them, manually, every single week.",
        "An intelligent editorial calendar flips that relationship: the idea, the content, the date, the network and the outcome live in the same place, connected. You stop losing time matching files against each other — you see exactly where every publication stands, from the first topic to measured performance.",
        "This isn't about chasing a trendy tool — it's about getting back the time you spend organizing, every week, so you can spend it producing instead.",
      ],
      author: "The ClickPost team",
      publishedAt: "2026-02-03",
      readingMinutes: 4,
      featured: true,
    },
    {
      slug: "banque-idees-jamais-a-court",
      category: "strategy",
      title: "How to never run out of content ideas again",
      excerpt: "Running out of inspiration isn't a creativity problem — it's a systems problem. Here's how to build an idea reserve that lasts for months.",
      paragraphs: [
        "Looking for an idea on the same day you need to publish is the number one source of generic content. Under pressure, you default to what's already been done instead of exploring a new angle.",
        "The fix isn't forcing more creativity at the last minute — it's decoupling idea generation from production. Set aside dedicated time to explore a theme in depth and pull dozens of topics out of it at once.",
        "Then keep them in an idea bank organized by theme, not in a document that just keeps growing without structure. When it's time to produce, you pick from already-qualified options instead of starting from a blank page.",
      ],
      author: "The ClickPost team",
      publishedAt: "2026-01-22",
      readingMinutes: 3,
    },
    {
      slug: "ia-copilote-pas-generateur",
      category: "ai",
      title: "AI isn't a post generator — it's a copilot",
      excerpt: "Using AI to publish faster often leads to interchangeable content. Used as a copilot built into your workflow, it produces the opposite.",
      paragraphs: [
        "Many tools sell AI as a magic button: an idea goes in, a generic post comes out. The result rarely feels authentic, and often gets rewritten entirely before it's published.",
        "Useful AI isn't the kind that replaces your voice — it's the kind that stays connected to your real context: your brand, your calendar, your past publications. It's there to develop an idea, rephrase a passage, or suggest a hook, never to decide alone what gets published.",
        "The goal isn't to produce faster for the sake of speed. It's to stay inside your workflow — without opening a separate tab, copy-pasting, and coming back — from the first topic all the way to the scheduled publication.",
      ],
      author: "The ClickPost team",
      publishedAt: "2026-01-10",
      readingMinutes: 4,
    },
    {
      slug: "publier-regulierement-sans-epuisement",
      category: "productivity",
      title: "Publishing consistently without burning out: what actually makes the difference",
      excerpt: "Consistency doesn't come from motivation — it comes from a system that makes every step lighter.",
      paragraphs: [
        "Consistency in content is often framed as a discipline problem. In reality, it's almost always a friction problem: the more manual steps between an idea and a publication, the easier it is to drop off along the way.",
        "Reducing that friction doesn't mean producing less content — it means grouping the steps that should naturally belong together: finding the idea, developing it, scheduling it, publishing it. Every extra tool in the chain is one more chance to let everything slide during a busy week.",
        "A single workspace doesn't make creativity easier — but it removes everything around it that drains your energy before you've even started writing.",
      ],
      author: "The ClickPost team",
      publishedAt: "2025-12-18",
      readingMinutes: 3,
    },
  ],
};

export function getBlogPosts(locale: Locale): BlogPost[] {
  return POSTS[locale];
}

export function getBlogPost(locale: Locale, slug: string): BlogPost | undefined {
  return POSTS[locale].find((post) => post.slug === slug);
}

export function getAllBlogSlugs(): string[] {
  return POSTS.fr.map((post) => post.slug);
}
