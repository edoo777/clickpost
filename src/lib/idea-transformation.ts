import type { NewPostInput } from "@/lib/posts";
import type { ContentVersion } from "@/types/content-version";
import type { Idea } from "@/types/idea";

/**
 * Aplatit la version courante (ou, à défaut, les champs à plat de l'idée) en un texte lisible
 * pour `Publication.text`, quel que soit le format. Une idée jamais ouverte dans l'Atelier ni
 * générée reste transformable — aucune obligation d'être passé par la génération assistée.
 */
export function serializeVersionToText(idea: Idea, version: ContentVersion | undefined): string {
  if (!version) {
    return [idea.hook, idea.contentPlan, idea.body, idea.conclusion].filter(Boolean).join("\n\n");
  }

  switch (version.format) {
    case "text":
      return [version.body.hook, version.body.intro, version.body.body, version.body.conclusion]
        .filter(Boolean)
        .join("\n\n");
    case "carousel":
      return [
        version.body.hook,
        ...version.body.slides.map((slide, index) => `${index + 1}. ${slide.title} — ${slide.text}`),
        version.body.conclusion,
      ]
        .filter(Boolean)
        .join("\n");
    case "short_video":
      return [version.body.hook, version.body.script].filter(Boolean).join("\n\n");
    case "story":
      return version.body.screens.map((screen, index) => `Écran ${index + 1} : ${screen.text}`).join("\n");
    case "image":
      return [version.body.concept, version.body.onImageText, version.body.caption].filter(Boolean).join("\n\n");
    case "article":
      return [
        version.body.title,
        version.body.intro,
        ...version.body.sections.map((section) => `${section.heading}\n${section.text}`),
        version.body.conclusion,
      ]
        .filter(Boolean)
        .join("\n\n");
    default:
      return "";
  }
}

export function ctaFromVersion(version: ContentVersion | undefined, idea: Idea): string {
  return version?.body.cta ?? idea.cta ?? "";
}

export function hashtagsFromVersion(version: ContentVersion | undefined, idea: Idea): string[] {
  if (version) {
    switch (version.format) {
      case "text":
      case "carousel":
      case "short_video":
      case "image":
        return version.body.hashtags;
      default:
        break;
    }
  }
  return idea.hashtags ?? [];
}

export function firstCommentFromVersion(version: ContentVersion | undefined, idea: Idea): string {
  if (version?.format === "text") return version.body.firstComment ?? "";
  return idea.firstComment ?? "";
}

export function buildPostInputFromIdea(
  idea: Idea,
  version: ContentVersion | undefined,
  brandName: string,
  themeLabel: string
): NewPostInput {
  return {
    brand: brandName,
    platform: idea.platform!,
    format: version?.format ?? idea.format ?? "text",
    scheduledFor: idea.scheduledFor,
    theme: themeLabel,
    themeId: idea.themeId,
    objective: idea.objective ?? "",
    angle: idea.angle,
    excerpt: idea.title,
    text: serializeVersionToText(idea, version),
    cta: ctaFromVersion(version, idea),
    hashtags: hashtagsFromVersion(version, idea),
    media: idea.media,
    priority: idea.priority,
    dueDate: idea.dueDate,
    owner: idea.owner,
    approver: idea.approver,
    campaignId: idea.campaignId,
    internalNotes: idea.internalNotes,
    source: idea.source,
  };
}
