import type { Brand } from "@/types/brand";
import type { Campaign } from "@/types/campaign";
import type { ContentVersion } from "@/types/content-version";
import type { SocialAccount } from "@/types/dashboard";
import type { Idea } from "@/types/idea";
import type { ImportantDate } from "@/types/important-date";
import type { Publication } from "@/types/publication";
import type { SavedView } from "@/types/saved-view";
import type { AgencySettings } from "@/types/settings";
import type { TeamMember } from "@/types/team";
import type { Theme } from "@/types/theme";
import type { Topic, TopicBatch } from "@/types/topic-batch";
import type { UserProfileExtra } from "@/types/user-profile";
import type { WorkflowStage } from "@/types/workflow-stage";

export const WORKSPACE_SCHEMA_VERSION = 1;

/** Une entrée par tranche d'état persistée : une par magasin (ou sous-état de magasin). */
export interface WorkspaceData {
  posts: Publication[];
  accounts: SocialAccount[];
  brands: Brand[];
  teamMembers: TeamMember[];
  currentUserId: string;
  settings: AgencySettings;
  themes: Theme[];
  campaigns: Campaign[];
  topicBatches: TopicBatch[];
  topics: Topic[];
  ideas: Idea[];
  contentVersions: ContentVersion[];
  workflowStages: WorkflowStage[];
  savedViews: SavedView[];
  userProfiles: Record<string, UserProfileExtra>;
  importantDates: ImportantDate[];
}

export type WorkspaceKey = keyof WorkspaceData;

export interface WorkspaceSnapshot {
  schemaVersion: number;
  id: string;
  savedAt: string;
  data: Partial<WorkspaceData>;
}

export interface PersistenceAdapter {
  loadWorkspace(): Promise<WorkspaceSnapshot | null>;
  saveWorkspace(snapshot: WorkspaceSnapshot): Promise<void>;
  clearWorkspace(): Promise<void>;
  getLastSavedAt(): Promise<string | null>;
}
