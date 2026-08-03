import type { Brand } from "@/types/brand";

type TrackedField =
  | "name"
  | "industry"
  | "description"
  | "productsAndServices"
  | "targetAudience"
  | "audiencePainPoints"
  | "communicationGoals"
  | "toneOfVoice"
  | "languages"
  | "priorityTopics"
  | "topicsToAvoid"
  | "preferredPhrases"
  | "forbiddenWords"
  | "preferredCtas"
  | "socialPlatforms"
  | "contentExamples"
  | "valueProposition"
  | "positioning"
  | "publishingFrequency"
  | "monthlyPublishingGoal"
  | "preferredContentTypes"
  | "preferredFormats"
  | "successMetrics";

export type CompletenessSource = Pick<Brand, TrackedField>;

const TRACKED_FIELDS: TrackedField[] = [
  "name",
  "industry",
  "description",
  "productsAndServices",
  "targetAudience",
  "audiencePainPoints",
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
  "valueProposition",
  "positioning",
  "publishingFrequency",
  "monthlyPublishingGoal",
  "preferredContentTypes",
  "preferredFormats",
  "successMetrics",
];

function isFieldFilled(value: CompletenessSource[TrackedField]): boolean {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") return value.trim().length > 0;
  return false;
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
