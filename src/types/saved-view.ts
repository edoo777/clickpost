export type SavedViewType =
  | "table"
  | "calendar"
  | "kanban";

export type SavedViewGroupBy =
  | "systemStatus"
  | "workflowStageId"
  | "format"
  | "themeId"
  | "platform"
  | "campaignId"
  | "owner"
  | "priority";

export type SavedViewFilterOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "in"
  | "not_in"
  | "before"
  | "after"
  | "is_empty"
  | "is_not_empty";

export interface SavedViewFilter {
  property: string;
  operator: SavedViewFilterOperator;
  value: string | number | boolean | string[] | null;
}

export interface SavedViewSort {
  property: string;
  direction: "asc" | "desc";
}

export interface SavedView {
  id: string;
  workspaceId: string;
  brandId?: string;
  name: string;
  description?: string;
  viewType: SavedViewType;
  groupBy?: SavedViewGroupBy;
  filters: SavedViewFilter[];
  sorting: SavedViewSort[];
  visibleProperties: string[];
  hiddenGroups: string[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}
