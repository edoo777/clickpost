import { STATUS_LABEL } from "@/lib/post-status";
import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";
import type {
  ContentPriority,
  ContentSource,
  Publication,
  PublicationHistoryEntry,
  PublicationMedia,
  PublicationStatus,
} from "@/types/publication";

export interface NewPostInput {
  brand: string;
  accountId?: string;
  platform: SocialPlatform;
  scheduledFor?: string;
  timeZone?: string;
  theme?: string;
  themeId?: string;
  format: ContentFormat;
  objective?: string;
  angle?: string;
  excerpt: string;
  text?: string;
  cta?: string;
  hashtags?: string[];
  media?: PublicationMedia[];
  status?: PublicationStatus;
  priority?: ContentPriority;
  dueDate?: string;
  owner?: string;
  approver?: string;
  campaignId?: string;
  internalNotes?: string;
  source?: ContentSource;
}

export function buildNewPost(input: NewPostInput): Publication {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    brand: input.brand,
    accountId: input.accountId ?? "unassigned",
    platform: input.platform,
    scheduledFor: input.scheduledFor ?? now,
    timeZone: input.timeZone ?? "UTC",
    theme: input.theme ?? "",
    themeId: input.themeId,
    format: input.format,
    objective: input.objective ?? "",
    angle: input.angle,
    excerpt: input.excerpt,
    text: input.text ?? "",
    cta: input.cta ?? "",
    hashtags: input.hashtags ?? [],
    firstComment: "",
    media: input.media ?? [],
    status: input.status ?? "idea",
    priority: input.priority,
    dueDate: input.dueDate,
    owner: input.owner ?? "",
    approver: input.approver ?? "",
    campaignId: input.campaignId,
    internalNotes: input.internalNotes ?? "",
    comments: [],
    history: [],
    source: input.source ?? "manual",
    createdAt: now,
    updatedAt: now,
  };
}

export function duplicatePublication(publication: Publication): Publication {
  const now = new Date().toISOString();
  return {
    ...publication,
    id: crypto.randomUUID(),
    excerpt: `${publication.excerpt} (copie)`,
    status: "draft",
    comments: [],
    history: [],
    // Une copie n'a jamais été publiée : elle ne doit hériter ni des tentatives de publication
    // ni de la checklist de promotion de l'originale.
    publishAttempts: [],
    promotionTasks: [],
    source: "manual",
    createdAt: now,
    updatedAt: now,
    linkedPublicationId: publication.id,
  };
}

export function changePublicationStatus(
  publication: Publication,
  status: PublicationStatus,
  actorName: string
): Publication {
  const now = new Date().toISOString();
  const entry: PublicationHistoryEntry = {
    id: crypto.randomUUID(),
    action: `Statut changé vers « ${STATUS_LABEL[status]} »`,
    actorName,
    createdAt: now,
  };
  return { ...publication, status, updatedAt: now, history: [...publication.history, entry] };
}

export interface PostFilters {
  brand?: string;
  status?: PublicationStatus;
  themeId?: string;
  campaignId?: string;
  platform?: SocialPlatform;
  priority?: ContentPriority;
  source?: ContentSource;
  dateFrom?: string;
  dateTo?: string;
}

export function filterPosts(posts: Publication[], filters: PostFilters): Publication[] {
  return posts.filter((post) => {
    if (filters.brand && post.brand !== filters.brand) return false;
    if (filters.status && post.status !== filters.status) return false;
    if (filters.themeId && post.themeId !== filters.themeId) return false;
    if (filters.campaignId && post.campaignId !== filters.campaignId) return false;
    if (filters.platform && post.platform !== filters.platform) return false;
    if (filters.priority && post.priority !== filters.priority) return false;
    if (filters.source && post.source !== filters.source) return false;
    if (filters.dateFrom && post.scheduledFor.slice(0, 10) < filters.dateFrom) return false;
    if (filters.dateTo && post.scheduledFor.slice(0, 10) > filters.dateTo) return false;
    return true;
  });
}
