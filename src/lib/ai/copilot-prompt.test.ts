import { describe, expect, it } from "vitest";
import { buildCopilotPrompt, type CopilotPromptInput } from "@/lib/ai/copilot-prompt";
import type { BrandProfile } from "@/types/brand";

const BASE_BRAND: BrandProfile = {
  id: "brand-1",
  name: "Acme",
  industry: "Cosmétique",
  description: "Marque de cosmétiques bio.",
  productsAndServices: ["Crèmes", "Sérums"],
  targetAudience: "Femmes 25-45 ans",
  audiencePainPoints: ["Peau sensible"],
  communicationGoals: ["Notoriété"],
  toneOfVoice: "Chaleureux",
  languages: ["fr"],
  priorityTopics: ["Routine beauté"],
  topicsToAvoid: [],
  preferredPhrases: [],
  forbiddenWords: [],
  preferredCtas: [],
  socialPlatforms: ["instagram"],
  contentExamples: [],
  preferredContentTypes: [],
  preferredFormats: [],
  successMetrics: [],
};

const BASE_INPUT: CopilotPromptInput = {
  brand: BASE_BRAND,
  connectedAccounts: [],
  themes: [],
  ideas: [],
  publications: [],
  message: "Propose-moi une idée de publication.",
};

describe("buildCopilotPrompt — admin prompt overrides (espace Admin > Prompts IA)", () => {
  it("never includes an admin note or extra instructions when none is configured (repli sécurisé)", () => {
    const prompt = buildCopilotPrompt(BASE_INPUT);
    expect(prompt.system).not.toContain("Note de l'administrateur ClickPost");
    expect(prompt.system).not.toContain("Instructions complémentaires");
  });

  it("prepends a configured systemPromptOverride, without dropping the hardcoded persona/safety instructions", () => {
    const prompt = buildCopilotPrompt({
      ...BASE_INPUT,
      systemPromptOverride: "Reste toujours bref et positif.",
    });
    expect(prompt.system).toContain("Note de l'administrateur ClickPost : Reste toujours bref et positif.");
    // Le prompt système codé en dur (persona/rôle) reste présent, jamais remplacé.
    expect(prompt.system).toContain("Tu es ClickPost Editorial Copilot");
    // L'override apparaît AVANT la persona codée en dur (prepend, jamais un remplacement).
    expect(prompt.system.indexOf("Note de l'administrateur")).toBeLessThan(prompt.system.indexOf("Tu es ClickPost Editorial Copilot"));
  });

  it("appends configured extraInstructions after the base rules, without dropping them", () => {
    const prompt = buildCopilotPrompt({
      ...BASE_INPUT,
      extraInstructions: "Toujours proposer un hook accrocheur en premier.",
    });
    expect(prompt.system).toContain("Instructions complémentaires (configurées par l'administrateur ClickPost) : Toujours proposer un hook accrocheur en premier.");
    expect(prompt.system).toContain("Tu es ClickPost Editorial Copilot");
  });

  it("supports both overrides simultaneously, in the correct order", () => {
    const prompt = buildCopilotPrompt({
      ...BASE_INPUT,
      systemPromptOverride: "Ton amical.",
      extraInstructions: "Cite toujours une source.",
    });
    const noteIndex = prompt.system.indexOf("Note de l'administrateur");
    const personaIndex = prompt.system.indexOf("Tu es ClickPost Editorial Copilot");
    const extraIndex = prompt.system.indexOf("Instructions complémentaires");
    expect(noteIndex).toBeGreaterThanOrEqual(0);
    expect(personaIndex).toBeGreaterThan(noteIndex);
    expect(extraIndex).toBeGreaterThan(personaIndex);
  });

  it("treats an empty-string override the same as absent (no stray admin note)", () => {
    const prompt = buildCopilotPrompt({ ...BASE_INPUT, systemPromptOverride: "", extraInstructions: "" });
    expect(prompt.system).not.toContain("Note de l'administrateur");
    expect(prompt.system).not.toContain("Instructions complémentaires");
  });
});

describe("buildCopilotPrompt — brand context completeness", () => {
  it("includes every brand-profile field that the UI collects (regression: fields silently dropped from AI prompts)", () => {
    const prompt = buildCopilotPrompt({
      ...BASE_INPUT,
      brand: {
        ...BASE_BRAND,
        subNiche: "Soins anti-âge",
        market: "France",
        languages: ["fr", "en"],
        publishingFrequency: "3 fois par semaine",
        monthlyPublishingGoal: 12,
        preferredFormats: ["carousel"],
        successMetrics: ["Taux d'engagement"],
        contentExamples: [{ id: "ex-1", platform: "instagram", title: "Routine du matin", excerpt: "..." }],
      },
    });
    expect(prompt.user).toContain("Soins anti-âge");
    expect(prompt.user).toContain("France");
    expect(prompt.user).toContain("3 fois par semaine");
    expect(prompt.user).toContain("12");
    expect(prompt.user).toContain("Formats privilégiés");
    expect(prompt.user).toContain("Indicateurs de réussite");
    expect(prompt.user).toContain("Routine du matin");
  });
});
