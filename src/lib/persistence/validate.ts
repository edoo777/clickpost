import { WORKSPACE_SCHEMA_VERSION, type WorkspaceSnapshot } from "@/lib/persistence/types";

export function isValidSnapshot(value: unknown): value is WorkspaceSnapshot {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<WorkspaceSnapshot>;
  if (typeof candidate.schemaVersion !== "number" || candidate.schemaVersion > WORKSPACE_SCHEMA_VERSION) {
    return false;
  }
  if (typeof candidate.id !== "string" || !candidate.id) return false;
  if (typeof candidate.savedAt !== "string" || Number.isNaN(Date.parse(candidate.savedAt))) return false;
  if (!candidate.data || typeof candidate.data !== "object" || Array.isArray(candidate.data)) return false;
  return true;
}
