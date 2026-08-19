import { describe, expect, it } from "vitest";
import { buildGenerateurPrompt, type GenerateurPromptInput } from "@/lib/ai/generateur-prompt";

const BASE_INPUT: GenerateurPromptInput = {
  niche: "Fitness",
  brandName: "Acme Fit",
  themes: [{ themeId: "theme-1", label: "Plan d'affaires", requestedCount: 5, distribution: {} }],
  formats: ["text"],
  platforms: ["instagram"],
  tone: "professional",
  language: "fr",
};

describe("buildGenerateurPrompt — priorité de la demande libre (« Que souhaitez-vous générer ? »)", () => {
  it("place la demande utilisateur en tête du prompt système, marquée comme prioritaire, quand elle est fournie", () => {
    const prompt = buildGenerateurPrompt({
      ...BASE_INPUT,
      instructions: "Génère-moi 30 sujets sur les étapes pour créer une entreprise.",
    });
    expect(prompt.system).toContain("PRIORITÉ ABSOLUE");
    expect(prompt.system).toContain("Génère-moi 30 sujets sur les étapes pour créer une entreprise.");
    // La demande doit apparaître avant les règles de distinction niche/thématique/sujet, jamais
    // après (une instruction enfouie en fin de prompt aurait beaucoup moins de poids réel).
    const priorityIndex = prompt.system.indexOf("PRIORITÉ ABSOLUE");
    const distinctionIndex = prompt.system.indexOf("DISTINCTION STRICTE");
    expect(priorityIndex).toBeGreaterThanOrEqual(0);
    expect(distinctionIndex).toBeGreaterThan(priorityIndex);
  });

  it("ne mentionne jamais de demande utilisateur ni de rappel de priorité quand aucune instruction n'est fournie", () => {
    const prompt = buildGenerateurPrompt(BASE_INPUT);
    expect(prompt.system).not.toContain("PRIORITÉ ABSOLUE");
    expect(prompt.user).not.toContain("Rappel : respecte en priorité");
  });

  it("ajoute un rappel court (pas une répétition intégrale) dans le message utilisateur quand une instruction est fournie", () => {
    const prompt = buildGenerateurPrompt({
      ...BASE_INPUT,
      instructions: "Donne-moi 20 citations célèbres sur l'entrepreneuriat.",
    });
    expect(prompt.user).toContain("Rappel : respecte en priorité la demande exacte de l'utilisateur");
    expect(prompt.user).not.toContain("Donne-moi 20 citations célèbres");
  });
});
