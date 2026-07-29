import type { Brand } from "@/types/brand";

type TrackedField =
  | "name"
  | "industry"
  | "description"
  | "productsAndServices"
  | "targetAudience"
  | "communicationGoals"
  | "toneOfVoice"
  | "languages"
  | "priorityTopics"
  | "topicsToAvoid"
  | "preferredPhrases"
  | "forbiddenWords"
  | "preferredCtas"
  | "socialPlatforms"
  | "contentExamples";

export type CompletenessSource = Pick<Brand, TrackedField>;

const TRACKED_FIELDS: TrackedField[] = [
  "name",
  "industry",
  "description",
  "productsAndServices",
  "targetAudience",
  "communicationGoals",
  "toneOfVoice",
  "languages",
  "priorityTopics",
  "topicsToAvoid",
  "preferredPhrases",
  "forbiddenWords",
  "preferredCtas",
  "socialPlatforms",
  "contentExamples",
];

function isFieldFilled(value: CompletenessSource[TrackedField]): boolean {
  if (Array.isArray(value)) return value.length > 0;
  return value.trim().length > 0;
}

export interface BrandCompleteness {
  percent: number;
  filledCount: number;
  totalCount: number;
}

export function getBrandCompleteness(profile: CompletenessSource): BrandCompleteness {
  const totalCount = TRACKED_FIELDS.length;
  const filledCount = TRACKED_FIELDS.filter((field) => isFieldFilled(profile[field])).length;
  const percent = Math.round((filledCount / totalCount) * 100);
  return { percent, filledCount, totalCount };
}
