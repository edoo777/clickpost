import type { RichDocument } from "@/types/rich-document";

export type VersionSource = "manual" | "ai";

interface ContentVersionBase {
  id: string;
  ideaId: string;
  versionNumber: number;
  name?: string;
  source: VersionSource;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  instructions?: string;
  isCurrent: boolean;
}

export interface TextBody {
  hook: string;
  intro: string;
  body: string;
  examples?: string[];
  conclusion: string;
  cta: string;
  hashtags: string[];
  firstComment?: string;
  /** Formatage riche du corps (Atelier) — optionnel : les versions plus anciennes n'en ont pas. */
  documentContent?: RichDocument;
}

export interface CarouselSlide {
  title: string;
  text: string;
}

export interface CarouselBody {
  coverTitle: string;
  hook: string;
  slides: CarouselSlide[];
  conclusion: string;
  cta: string;
  caption: string;
  hashtags: string[];
}

export interface VideoScene {
  text: string;
  onScreenText?: string;
}

export interface ShortVideoBody {
  hook: string;
  script: string;
  scenes: VideoScene[];
  durationSeconds?: number;
  cta: string;
  caption: string;
  hashtags: string[];
}

export interface StoryScreen {
  text: string;
  visualHint?: string;
}

export interface StoryBody {
  screens: StoryScreen[];
  interaction?: "question" | "poll" | "none";
  cta?: string;
}

export interface ImageBody {
  concept: string;
  onImageText?: string;
  caption: string;
  cta: string;
  hashtags: string[];
}

export interface LongFormSection {
  heading: string;
  text: string;
}

export interface LongFormBody {
  title: string;
  intro: string;
  plan: string[];
  sections: LongFormSection[];
  conclusion: string;
  cta: string;
  socialSummary: string;
}

export type ContentVersion =
  | (ContentVersionBase & { format: "text"; body: TextBody })
  | (ContentVersionBase & { format: "carousel"; body: CarouselBody })
  | (ContentVersionBase & { format: "short_video"; body: ShortVideoBody })
  | (ContentVersionBase & { format: "story"; body: StoryBody })
  | (ContentVersionBase & { format: "image"; body: ImageBody })
  | (ContentVersionBase & { format: "article"; body: LongFormBody });
