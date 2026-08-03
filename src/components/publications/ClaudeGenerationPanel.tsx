"use client";

import { useState } from "react";
import type { GenerationLength, GenerationTone } from "@/lib/assisted-generation";
import { LENGTH_LABEL, TONE_LABEL } from "@/lib/assisted-generation";
import { runPublicationGeneration, type PublicationGenerationProposal } from "@/lib/ai/publication-generation-client";
import {
  getPublicationQuickAction,
  PUBLICATION_QUICK_ACTIONS,
  type PublicationQuickActionKind,
} from "@/lib/ai/quick-actions";
import { runPublicationQuickAction } from "@/lib/banque-quick-action";
import { useBrandsSession } from "@/lib/brands-store";
import { ALL_CONTENT_TYPES, CONTENT_TYPE_LABEL, type ContentType } from "@/lib/content-types";
import { CONTENT_FORMATS, FORMAT_LABEL } from "@/lib/editorial-constants";
import { PLATFORM_LABEL } from "@/lib/post-status";
import { getThemesForBrand } from "@/lib/themes";
import { useThemesSession } from "@/lib/themes-store";
import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";
import type { Publication } from "@/types/publication";

const ALL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "x"];
const TONES: GenerationTone[] = [
  "professional",
  "friendly",
  "enthusiastic",
  "direct",
  "pedagogical",
  "inspiring",
  "conversational",
  "expert",
  "storytelling",
  "provocative",
];
const LENGTHS: GenerationLength[] = ["short", "medium", "long"];

const FIELD_CLASS = "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 dark:bg-zinc-900";
const LABEL_CLASS = "flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300";

function confirmIfFilled(currentValue: string, fieldLabel: string): boolean {
  if (!currentValue.trim()) return true;
  return window.confirm(`Le champ « ${fieldLabel} » contient déjà du texte. Le remplacer ?`);
}

interface ClaudeGenerationPanelProps {
  publication: Publication;
  onApplyPatch: (patch: Partial<Publication>) => void;
  canUndo: boolean;
  onUndo: () => void;
}

/**
 * Panneau de génération du mode Claude — jamais appelé automatiquement, uniquement sur clic
 * explicite « Générer »/« Régénérer » ou sur une action rapide. Ne modifie jamais directement le
 * formulaire : chaque proposition reste un aperçu tant que l'utilisateur n'a pas cliqué sur une
 * action « Appliquer » précise, avec confirmation si le champ ciblé contient déjà du texte.
 */
export function ClaudeGenerationPanel({ publication, onApplyPatch, canUndo, onUndo }: ClaudeGenerationPanelProps) {
  const { brands, activeBrand } = useBrandsSession();
  const { themes } = useThemesSession();

  const [brandId, setBrandId] = useState(activeBrand?.id ?? "");
  const [standaloneNiche, setStandaloneNiche] = useState("");
  const [platform, setPlatform] = useState<SocialPlatform>(publication.platform);
  const [themeId, setThemeId] = useState("");
  const [adhocTheme, setAdhocTheme] = useState("");
  const [contentType, setContentType] = useState<ContentType | "">("");
  const [format, setFormat] = useState<ContentFormat>(publication.format);
  const [objective, setObjective] = useState(publication.objective || "");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState<GenerationTone | "">("");
  const [language, setLanguage] = useState("fr");
  const [length, setLength] = useState<GenerationLength>("medium");
  const [instructions, setInstructions] = useState("");

  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [proposal, setProposal] = useState<PublicationGenerationProposal | null>(null);
  const [selectedTitleIndex, setSelectedTitleIndex] = useState(0);

  const [quickActionBusy, setQuickActionBusy] = useState<PublicationQuickActionKind | null>(null);
  const [quickActionError, setQuickActionError] = useState<string | null>(null);
  const [quickActionChoices, setQuickActionChoices] = useState<{ action: PublicationQuickActionKind; items: string[] } | null>(null);
  const [toneForChange, setToneForChange] = useState<GenerationTone | "">("");

  const brandThemes = brandId ? getThemesForBrand(themes, brandId) : [];

  async function handleGenerate() {
    if (status === "loading") return; // empêche les doubles clics.
    setStatus("loading");
    setErrorMessage(null);
    const outcome = await runPublicationGeneration({
      brandId: brandId || undefined,
      standaloneNiche: brandId ? undefined : standaloneNiche || undefined,
      platform,
      themeId: themeId || undefined,
      adhocTheme: themeId ? undefined : adhocTheme || undefined,
      contentType: contentType || undefined,
      format,
      objective: objective || undefined,
      audience: audience || undefined,
      tone: tone || undefined,
      language: language || undefined,
      length,
      instructions: instructions || undefined,
      existingTitle: publication.excerpt || undefined,
      existingText: publication.text || undefined,
      existingCta: publication.cta || undefined,
      existingHashtags: publication.hashtags.length > 0 ? publication.hashtags : undefined,
    });
    if (outcome.status !== "ok") {
      setStatus("error");
      setErrorMessage(outcome.message);
      return;
    }
    setStatus("idle");
    setProposal(outcome.proposal);
    setSelectedTitleIndex(0);
  }

  function applyTitle() {
    if (!proposal) return;
    const title = proposal.titles[selectedTitleIndex];
    if (!title || !confirmIfFilled(publication.excerpt, "Titre / extrait")) return;
    onApplyPatch({ excerpt: title });
  }
  function applyText() {
    if (!proposal) return;
    if (!confirmIfFilled(publication.text, "Texte de la publication")) return;
    onApplyPatch({ text: proposal.text });
  }
  function applyCta() {
    if (!proposal) return;
    if (!confirmIfFilled(publication.cta, "Appel à l'action")) return;
    onApplyPatch({ cta: proposal.cta });
  }
  function applyHashtags() {
    if (!proposal) return;
    if (publication.hashtags.length > 0 && !window.confirm("Les hashtags actuels contiennent déjà du contenu. Les remplacer ?")) return;
    onApplyPatch({ hashtags: proposal.hashtags });
  }
  function applyAll() {
    if (!proposal) return;
    const alreadyFilled = Boolean(publication.excerpt.trim() || publication.text.trim() || publication.cta.trim()) || publication.hashtags.length > 0;
    if (alreadyFilled && !window.confirm("Certains champs contiennent déjà du contenu. Tout remplacer par la proposition ?")) return;
    onApplyPatch({
      excerpt: proposal.titles[selectedTitleIndex] ?? publication.excerpt,
      theme: proposal.theme || publication.theme,
      objective: proposal.objective || publication.objective,
      text: proposal.text,
      cta: proposal.cta,
      hashtags: proposal.hashtags,
    });
  }

  async function runQuickAction(action: PublicationQuickActionKind) {
    if (quickActionBusy) return; // empêche les doubles clics / appels concurrents.
    const definition = getPublicationQuickAction(action);
    if ((definition.targetField === "text" || (definition.targetField === "cta" && action === "publication_improve_cta")) && !publication.text.trim()) {
      setQuickActionError("Rédigez d'abord un texte avant d'utiliser cette action.");
      return;
    }
    setQuickActionBusy(action);
    setQuickActionError(null);
    setQuickActionChoices(null);
    const outcome = await runPublicationQuickAction({
      action,
      title: publication.excerpt || undefined,
      text: publication.text || undefined,
      cta: publication.cta || undefined,
      hashtags: publication.hashtags.length > 0 ? publication.hashtags : undefined,
      tone: action === "publication_change_tone" ? toneForChange || undefined : undefined,
    });
    setQuickActionBusy(null);
    if (outcome.status !== "ok") {
      setQuickActionError(outcome.message);
      return;
    }
    if (definition.isList) {
      setQuickActionChoices({ action, items: outcome.items });
      return;
    }
    const result = outcome.items[0];
    if (!result) return;
    if (definition.targetField === "text") {
      if (!confirmIfFilled(publication.text, "Texte de la publication")) return;
      onApplyPatch({ text: result });
    } else if (definition.targetField === "cta") {
      if (!confirmIfFilled(publication.cta, "Appel à l'action")) return;
      onApplyPatch({ cta: result });
    }
  }

  function applyQuickActionChoice(item: string) {
    if (!quickActionChoices) return;
    const definition = getPublicationQuickAction(quickActionChoices.action);
    if (definition.targetField === "title") {
      if (!confirmIfFilled(publication.excerpt, "Titre / extrait")) return;
      onApplyPatch({ excerpt: item });
    } else if (definition.targetField === "hashtags") {
      if (!publication.hashtags.includes(item)) onApplyPatch({ hashtags: [...publication.hashtags, item] });
    }
  }

  function applyAllHashtagChoices() {
    if (!quickActionChoices) return;
    const newOnes = quickActionChoices.items.filter((item) => !publication.hashtags.includes(item));
    if (newOnes.length > 0) onApplyPatch({ hashtags: [...publication.hashtags, ...newOnes] });
    setQuickActionChoices(null);
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-violet-200 bg-violet-50/40 p-5 dark:border-violet-500/20 dark:bg-violet-500/[.04]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">Génération avec Claude</h2>
        {canUndo && (
          <button type="button" onClick={onUndo} className="text-xs font-medium text-muted-foreground hover:underline">
            Annuler la dernière insertion IA
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        <label className={LABEL_CLASS}>
          Marque
          <select value={brandId} onChange={(event) => setBrandId(event.target.value)} className={FIELD_CLASS}>
            <option value="">Sans marque (ponctuel)</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>{brand.name}</option>
            ))}
          </select>
        </label>

        {!brandId && (
          <label className={LABEL_CLASS}>
            Niche
            <input value={standaloneNiche} onChange={(event) => setStandaloneNiche(event.target.value)} placeholder="Ex. Fitness" className={FIELD_CLASS} />
          </label>
        )}

        <label className={LABEL_CLASS}>
          Réseau social
          <select value={platform} onChange={(event) => setPlatform(event.target.value as SocialPlatform)} className={FIELD_CLASS}>
            {ALL_PLATFORMS.map((p) => (
              <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>
            ))}
          </select>
        </label>

        <label className={LABEL_CLASS}>
          Thématique
          {brandThemes.length > 0 ? (
            <select value={themeId} onChange={(event) => setThemeId(event.target.value)} className={FIELD_CLASS}>
              <option value="">Autre thématique…</option>
              {brandThemes.map((theme) => (
                <option key={theme.id} value={theme.id}>{theme.label || "Sans titre"}</option>
              ))}
            </select>
          ) : (
            <input value={adhocTheme} onChange={(event) => setAdhocTheme(event.target.value)} placeholder="Libre" className={FIELD_CLASS} />
          )}
        </label>
        {brandThemes.length > 0 && !themeId && (
          <label className={LABEL_CLASS}>
            Thématique libre
            <input value={adhocTheme} onChange={(event) => setAdhocTheme(event.target.value)} placeholder="Libre" className={FIELD_CLASS} />
          </label>
        )}

        <label className={LABEL_CLASS}>
          Type de contenu
          <select value={contentType} onChange={(event) => setContentType(event.target.value as ContentType | "")} className={FIELD_CLASS}>
            <option value="">Non précisé</option>
            {ALL_CONTENT_TYPES.map((type) => (
              <option key={type} value={type}>{CONTENT_TYPE_LABEL[type]}</option>
            ))}
          </select>
        </label>

        <label className={LABEL_CLASS}>
          Format
          <select value={format} onChange={(event) => setFormat(event.target.value as ContentFormat)} className={FIELD_CLASS}>
            {CONTENT_FORMATS.map((f) => (
              <option key={f} value={f}>{FORMAT_LABEL[f]}</option>
            ))}
          </select>
        </label>

        <label className={LABEL_CLASS}>
          Ton
          <select value={tone} onChange={(event) => setTone(event.target.value as GenerationTone | "")} className={FIELD_CLASS}>
            <option value="">Ton de la marque</option>
            {TONES.map((t) => (
              <option key={t} value={t}>{TONE_LABEL[t]}</option>
            ))}
          </select>
        </label>

        <label className={LABEL_CLASS}>
          Longueur souhaitée
          <select value={length} onChange={(event) => setLength(event.target.value as GenerationLength)} className={FIELD_CLASS}>
            {LENGTHS.map((l) => (
              <option key={l} value={l}>{LENGTH_LABEL[l]}</option>
            ))}
          </select>
        </label>

        <label className={LABEL_CLASS}>
          Langue
          <input value={language} onChange={(event) => setLanguage(event.target.value)} placeholder="fr" className={FIELD_CLASS} />
        </label>

        <label className={LABEL_CLASS}>
          Audience
          <input value={audience} onChange={(event) => setAudience(event.target.value)} placeholder="Audience de la marque par défaut" className={FIELD_CLASS} />
        </label>

        <div className="md:col-span-2 lg:col-span-3">
          <label className={LABEL_CLASS}>
            Objectif
            <input value={objective} onChange={(event) => setObjective(event.target.value)} className={FIELD_CLASS} />
          </label>
        </div>

        <div className="md:col-span-2 lg:col-span-3">
          <label className={LABEL_CLASS}>
            Instruction complémentaire (facultatif)
            <textarea rows={2} value={instructions} onChange={(event) => setInstructions(event.target.value)} className={FIELD_CLASS} />
          </label>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Le profil de la marque active (niche, positionnement, ton, audience, comptes affiliés) est utilisé
        automatiquement lorsqu&apos;une marque est sélectionnée.
      </p>

      <div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={status === "loading"}
          className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 disabled:opacity-60"
        >
          {status === "loading" ? "Génération en cours…" : proposal ? "Régénérer" : "Générer"}
        </button>
        {status === "error" && errorMessage && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{errorMessage}</p>}
      </div>

      {proposal && (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
            Aperçu — rien n&apos;est encore appliqué au formulaire
          </p>

          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-muted-foreground">Titres proposés</p>
            {proposal.titles.map((title, index) => (
              <label key={title} className="flex items-center gap-2 text-sm text-foreground">
                <input type="radio" name="proposal-title" checked={selectedTitleIndex === index} onChange={() => setSelectedTitleIndex(index)} />
                {title}
              </label>
            ))}
            <button type="button" onClick={applyTitle} className="w-fit text-xs font-semibold text-violet-700 hover:underline dark:text-violet-300">
              Appliquer uniquement le titre
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-muted-foreground">Texte</p>
            <p className="whitespace-pre-wrap rounded-lg bg-muted/40 p-2 text-sm text-foreground">{proposal.text}</p>
            <button type="button" onClick={applyText} className="w-fit text-xs font-semibold text-violet-700 hover:underline dark:text-violet-300">
              Appliquer uniquement le texte
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-muted-foreground">Appel à l&apos;action</p>
            <p className="text-sm text-foreground">{proposal.cta}</p>
            <button type="button" onClick={applyCta} className="w-fit text-xs font-semibold text-violet-700 hover:underline dark:text-violet-300">
              Appliquer uniquement l&apos;appel à l&apos;action
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-muted-foreground">Hashtags</p>
            <p className="text-sm text-foreground">{proposal.hashtags.join(" ")}</p>
            <button type="button" onClick={applyHashtags} className="w-fit text-xs font-semibold text-violet-700 hover:underline dark:text-violet-300">
              Appliquer uniquement les hashtags
            </button>
          </div>

          <div className="flex flex-col gap-1 rounded-lg bg-amber-50 p-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-400">
            <p><strong>Suggestion de format :</strong> {proposal.formatSuggestion}</p>
            <p><strong>Suggestion de média à produire :</strong> {proposal.mediaSuggestion} — aucun média n&apos;a été créé, ceci est une description à réaliser vous-même.</p>
          </div>

          <button
            type="button"
            onClick={applyAll}
            className="w-fit rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-xs font-semibold text-white"
          >
            Appliquer tous les champs
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <p className="text-xs font-medium text-muted-foreground">Actions rapides — s&apos;appliquent au contenu déjà dans le formulaire</p>
        <div className="flex flex-wrap items-center gap-2">
          {PUBLICATION_QUICK_ACTIONS.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={() => void runQuickAction(action.key)}
              disabled={Boolean(quickActionBusy)}
              className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              {quickActionBusy === action.key ? "…" : action.label}
            </button>
          ))}
          <select value={toneForChange} onChange={(event) => setToneForChange(event.target.value as GenerationTone | "")} className={`${FIELD_CLASS} w-auto`}>
            <option value="">Ton pour « Changer le ton »</option>
            {TONES.map((t) => (
              <option key={t} value={t}>{TONE_LABEL[t]}</option>
            ))}
          </select>
        </div>
        {quickActionError && <p className="text-xs text-red-600 dark:text-red-400">{quickActionError}</p>}

        {quickActionChoices && (
          <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-surface p-3">
            <p className="text-xs font-medium text-muted-foreground">Choisissez une proposition à insérer</p>
            {quickActionChoices.items.map((item) => (
              <div key={item} className="flex items-center justify-between gap-2 text-sm text-foreground">
                <span>{item}</span>
                <button type="button" onClick={() => applyQuickActionChoice(item)} className="shrink-0 text-xs font-semibold text-violet-700 hover:underline dark:text-violet-300">
                  Insérer
                </button>
              </div>
            ))}
            {getPublicationQuickAction(quickActionChoices.action).targetField === "hashtags" && (
              <button type="button" onClick={applyAllHashtagChoices} className="w-fit text-xs font-semibold text-violet-700 hover:underline dark:text-violet-300">
                Ajouter tous les hashtags proposés
              </button>
            )}
            <button type="button" onClick={() => setQuickActionChoices(null)} className="w-fit text-xs text-muted-foreground hover:underline">
              Fermer
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
