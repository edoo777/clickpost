import type { ContentVersion, TextBody, VersionSource } from "@/types/content-version";
import type { Idea } from "@/types/idea";

function buildTextBody(idea: Idea): TextBody {
  return {
    hook: idea.hook ?? "",
    intro: idea.contentPlan ?? "",
    body: idea.body ?? "",
    examples: idea.keyPoints,
    conclusion: idea.conclusion ?? "",
    cta: idea.cta ?? "",
    hashtags: idea.hashtags ?? [],
    firstComment: idea.firstComment,
  };
}

export function nextVersionNumber(versions: ContentVersion[]): number {
  if (versions.length === 0) return 1;
  return Math.max(...versions.map((version) => version.versionNumber)) + 1;
}

export function buildVersionFromIdea(
  idea: Idea,
  versions: ContentVersion[],
  source: VersionSource = "manual",
  name?: string
): ContentVersion {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    ideaId: idea.id,
    versionNumber: nextVersionNumber(versions),
    name,
    source,
    format: "text",
    body: buildTextBody(idea),
    createdAt: now,
    updatedAt: now,
    isCurrent: true,
  };
}

export function applyVersionToIdea(version: ContentVersion): Partial<Idea> {
  if (version.format !== "text") return {};
  const body = version.body;
  return {
    hook: body.hook,
    contentPlan: body.intro,
    body: body.body,
    keyPoints: body.examples,
    conclusion: body.conclusion,
    cta: body.cta,
    hashtags: body.hashtags,
    firstComment: body.firstComment,
  };
}

export function duplicateVersion(version: ContentVersion, versions: ContentVersion[]): ContentVersion {
  const now = new Date().toISOString();
  return {
    ...version,
    id: crypto.randomUUID(),
    versionNumber: nextVersionNumber(versions),
    name: version.name ? `${version.name} (copie)` : undefined,
    isCurrent: false,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Construit une nouvelle version "text" dérivée d'une version existante (régénération de
 * section, raccourcir/développer/simplifier/changer le ton/adapter à un réseau) — ne modifie
 * jamais la version source, conformément au principe « rien ne s'écrase ».
 */
export function buildTransformedVersion(
  source: ContentVersion,
  transformedBody: TextBody,
  versions: ContentVersion[],
  name: string
): ContentVersion {
  const now = new Date().toISOString();
  return {
    ...source,
    id: crypto.randomUUID(),
    versionNumber: nextVersionNumber(versions),
    name,
    source: "ai",
    format: "text",
    body: transformedBody,
    isCurrent: true,
    createdAt: now,
    updatedAt: now,
  };
}
