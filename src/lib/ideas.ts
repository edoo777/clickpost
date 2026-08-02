import type { ContentType } from "@/lib/content-types";
import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";
import type { Idea, IdeaStatus } from "@/types/idea";
import type { ContentPriority, ContentSource } from "@/types/publication";
import type { Campaign } from "@/types/campaign";
import type { Theme } from "@/types/theme";
import type { TopicBatch } from "@/types/topic-batch";

export interface NewIdeaInput {
  brandId: string;
  title: string;
  themeId?: string;
  campaignId?: string;
  description?: string;
  contentType?: ContentType;
  objective?: string;
  priority?: ContentPriority;
  platform?: SocialPlatform;
  format?: ContentFormat;
  scheduledFor?: string;
  owner?: string;
  quickNotes?: string;
}

export function buildNewIdea(input: NewIdeaInput): Idea {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    brandId: input.brandId,
    themeId: input.themeId,
    campaignId: input.campaignId,
    title: input.title,
    description: input.description,
    contentType: input.contentType,
    objective: input.objective,
    source: "manual",
    status: "idea",
    priority: input.priority,
    platform: input.platform,
    format: input.format,
    scheduledFor: input.scheduledFor,
    owner: input.owner,
    quickNotes: input.quickNotes,
    createdAt: now,
    updatedAt: now,
  };
}

export function duplicateIdea(idea: Idea): Idea {
  const now = new Date().toISOString();
  return {
    ...idea,
    id: crypto.randomUUID(),
    title: `${idea.title} (copie)`,
    status: "idea",
    publicationId: undefined,
    createdAt: now,
    updatedAt: now,
  };
}

export interface IdeaFilters {
  brandId?: string;
  themeId?: string;
  batchId?: string;
  campaignId?: string;
  source?: ContentSource;
  status?: IdeaStatus;
  priority?: ContentPriority;
  platform?: SocialPlatform;
  format?: ContentFormat;
  dateFrom?: string;
  dateTo?: string;
  transformState?: "all" | "used" | "unused";
  includeArchived?: boolean;
}

export function filterIdeas(ideas: Idea[], filters: IdeaFilters): Idea[] {
  return ideas.filter((idea) => {
    if (filters.brandId && idea.brandId !== filters.brandId) return false;
    if (filters.themeId && idea.themeId !== filters.themeId) return false;
    if (filters.batchId && idea.batchId !== filters.batchId) return false;
    if (filters.campaignId && idea.campaignId !== filters.campaignId) return false;
    if (filters.source && idea.source !== filters.source) return false;
    if (filters.status && idea.status !== filters.status) return false;
    if (filters.priority && idea.priority !== filters.priority) return false;
    if (filters.platform && idea.platform !== filters.platform) return false;
    if (filters.format && idea.format !== filters.format) return false;
    if (filters.transformState === "used" && !idea.publicationId) return false;
    if (filters.transformState === "unused" && idea.publicationId) return false;
    if (!filters.includeArchived && idea.status === "archived") return false;

    if (filters.dateFrom || filters.dateTo) {
      if (!idea.scheduledFor) return false;
      const date = idea.scheduledFor.slice(0, 10);
      if (filters.dateFrom && date < filters.dateFrom) return false;
      if (filters.dateTo && date > filters.dateTo) return false;
    }

    return true;
  });
}

export function searchIdeas(ideas: Idea[], query: string): Idea[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return ideas;
  return ideas.filter((idea) => {
    const haystack = `${idea.title} ${idea.description ?? ""} ${idea.quickNotes ?? ""}`.toLowerCase();
    return haystack.includes(normalized);
  });
}

export interface IdeaGroup {
  key: string;
  label: string;
  ideas: Idea[];
}

function groupBy(ideas: Idea[], keyOf: (idea: Idea) => string, labelOf: (key: string) => string): IdeaGroup[] {
  const groups = new Map<string, IdeaGroup>();
  for (const idea of ideas) {
    const key = keyOf(idea);
    if (!groups.has(key)) groups.set(key, { key, label: labelOf(key), ideas: [] });
    groups.get(key)!.ideas.push(idea);
  }
  return Array.from(groups.values());
}

export function groupIdeasByTheme(ideas: Idea[], themes: Theme[]): IdeaGroup[] {
  return groupBy(
    ideas,
    (idea) => idea.themeId ?? "none",
    (key) => (key === "none" ? "Sans thématique" : themes.find((t) => t.id === key)?.label || "Sans titre")
  );
}

export function groupIdeasByBatch(ideas: Idea[], batches: TopicBatch[]): IdeaGroup[] {
  return groupBy(
    ideas,
    (idea) => idea.batchId ?? "none",
    (key) => (key === "none" ? "Idées manuelles" : batches.find((b) => b.id === key)?.name || "Bloc supprimé")
  );
}

export function groupIdeasByCampaign(ideas: Idea[], campaigns: Campaign[]): IdeaGroup[] {
  return groupBy(
    ideas,
    (idea) => idea.campaignId ?? "none",
    (key) => (key === "none" ? "Sans campagne" : campaigns.find((c) => c.id === key)?.name || "Campagne supprimée")
  );
}
