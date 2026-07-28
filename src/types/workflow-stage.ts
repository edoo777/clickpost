import type { IdeaStatus } from "@/types/idea";
import type { PublicationStatus } from "@/types/publication";

export type WorkflowSystemStatus =
  | IdeaStatus
  | PublicationStatus;

export type WorkflowStageScope =
  | {
      workspaceId: string;
      brandId?: string;
    }
  | {
      workspaceId?: string;
      brandId: string;
    };

export interface WorkflowStageBase {
  id: string;
  name: string;
  description?: string;
  color: string;
  order: number;
  systemStatus: WorkflowSystemStatus;
  active: boolean;
  isDefault: boolean;
  isTerminal: boolean;
  createdAt: string;
  updatedAt: string;
}

export type WorkflowStage =
  WorkflowStageBase & WorkflowStageScope;
