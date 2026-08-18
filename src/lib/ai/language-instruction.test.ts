import { describe, expect, it } from "vitest";
import { buildAtelierGenerationPrompt } from "@/lib/ai/atelier-prompts";
import { buildRewriteSelectionPrompt } from "@/lib/ai/rewrite-selection-prompt";
import { buildQuickActionPrompt, buildNoteQuickActionPrompt, buildPublicationQuickActionPrompt } from "@/lib/ai/quick-action-prompt";
import { buildSuggestThemesPrompt } from "@/lib/ai/suggest-themes-prompt";
import { buildTrendAnalysisPrompt } from "@/lib/ai/trend-analysis-prompt";
import { buildLanguageInstruction } from "@/lib/ai/prompt-context";
import type { AIGenerationContext } from "@/lib/assisted-generation";
import type { BrandProfile } from "@/types/brand";
import type { Idea } from "@/types/idea";
import type { ValidatedTrendAnalysisRequest } from "@/lib/ai/validate-trend-analysis-request";

const BRAND = {
  id: "brand-1",
  name: "Acme",
  industry: "Cosmétique",
  toneOfVoice: "Chaleureux",
  targetAudience: "Femmes 25-45 ans",
} as unknown as BrandProfile;

const IDEA = {
  id: "idea-1",
  brandId: "brand-1",
  title: "5 astuces routine beauté",
} as unknown as Idea;

const CONTEXT: AIGenerationContext = {
  idea: IDEA,
  brand: BRAND,
  tone: "professional",
  length: "medium",
};

/**
 * Chaque prompt IA réellement branché à Claude doit recevoir explicitement la langue de
 * l'utilisateur (profiles.ui_locale, jamais une valeur côté client) et l'injecter dans le prompt
 * système — sinon Claude répond toujours en français quelle que soit la langue de l'interface.
 * Un test par constructeur de prompt touché lors de l'audit du parcours complet.
 */
describe("AI prompt builders always carry an explicit language instruction", () => {
  it("buildAtelierGenerationPrompt — fr and en", () => {
    expect(buildAtelierGenerationPrompt(CONTEXT, "fr").system).toContain(buildLanguageInstruction("fr"));
    expect(buildAtelierGenerationPrompt(CONTEXT, "en").system).toContain(buildLanguageInstruction("en"));
  });

  it("buildRewriteSelectionPrompt — fr and en", () => {
    const params = { context: CONTEXT, selectedText: "texte", instruction: "raccourcis" };
    expect(buildRewriteSelectionPrompt({ ...params, language: "fr" }).system).toContain(buildLanguageInstruction("fr"));
    expect(buildRewriteSelectionPrompt({ ...params, language: "en" }).system).toContain(buildLanguageInstruction("en"));
  });

  it("buildQuickActionPrompt — fr and en", () => {
    const input = { action: "clarify" as const, title: "Titre" };
    expect(buildQuickActionPrompt(input, "fr").system).toContain(buildLanguageInstruction("fr"));
    expect(buildQuickActionPrompt(input, "en").system).toContain(buildLanguageInstruction("en"));
  });

  it("buildNoteQuickActionPrompt — fr and en", () => {
    const input = { action: "note_clarify" as const, content: "Une note libre." };
    expect(buildNoteQuickActionPrompt(input, "fr").system).toContain(buildLanguageInstruction("fr"));
    expect(buildNoteQuickActionPrompt(input, "en").system).toContain(buildLanguageInstruction("en"));
  });

  it("buildPublicationQuickActionPrompt — fr and en", () => {
    const input = { action: "publication_improve" as const, text: "Texte de la publication." };
    expect(buildPublicationQuickActionPrompt(input, "fr").system).toContain(buildLanguageInstruction("fr"));
    expect(buildPublicationQuickActionPrompt(input, "en").system).toContain(buildLanguageInstruction("en"));
  });

  it("buildSuggestThemesPrompt — fr and en", () => {
    const input = { brandName: "Acme", niche: "Cosmétique", existingThemeLabels: [] };
    expect(buildSuggestThemesPrompt(input, "fr").system).toContain(buildLanguageInstruction("fr"));
    expect(buildSuggestThemesPrompt(input, "en").system).toContain(buildLanguageInstruction("en"));
  });

  it("buildTrendAnalysisPrompt — fr and en", () => {
    const input = {
      title: "Vidéo tendance",
      sourceName: "YouTube",
      sourceUrl: "https://youtube.com/x",
      themeLabels: [],
    } as unknown as ValidatedTrendAnalysisRequest;
    expect(buildTrendAnalysisPrompt(input, "fr").system).toContain(buildLanguageInstruction("fr"));
    expect(buildTrendAnalysisPrompt(input, "en").system).toContain(buildLanguageInstruction("en"));
  });
});
