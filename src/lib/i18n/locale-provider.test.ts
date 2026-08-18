import { describe, expect, it } from "vitest";
import { resolve } from "@/lib/i18n/locale-provider";
import fr from "@/lib/i18n/dictionaries/fr";
import en from "@/lib/i18n/dictionaries/en";

describe("resolve (t() key lookup + {var} interpolation)", () => {
  it("resolves a plain nested key", () => {
    expect(resolve(fr, "common.save")).toBe("Enregistrer");
    expect(resolve(en, "common.save")).toBe("Save");
  });

  it("returns the key itself when it does not exist, rather than throwing or returning undefined", () => {
    expect(resolve(fr, "does.not.exist")).toBe("does.not.exist");
  });

  it("interpolates a single {var}", () => {
    expect(resolve(fr, "onboarding.stepOf", { step: 2, total: 9, title: "Nom" })).toBe(
      "Étape 2 sur 9 — Nom"
    );
  });

  it("leaves an unmatched {var} placeholder untouched instead of dropping it silently", () => {
    expect(resolve(fr, "onboarding.confirmation.intro", {})).toBe(
      "Tout est prêt, {name} ! Voici un résumé de votre espace :"
    );
  });

  it("substitutes the same {var} name wherever it appears in an English string", () => {
    expect(resolve(en, "auth.signup.successMessage", { email: "a@b.com" })).toBe(
      "Click the link sent to a@b.com to confirm your address and activate your account."
    );
  });
});
