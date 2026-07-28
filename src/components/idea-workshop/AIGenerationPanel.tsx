"use client";

import { useState } from "react";
import { CONTENT_FORMATS, FORMAT_LABEL } from "@/lib/editorial-constants";
import { PLATFORM_LABEL } from "@/lib/post-status";
import { LENGTH_LABEL, TONE_LABEL, type GenerationLength, type GenerationTone, type TextSection } from "@/lib/assisted-generation";
import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";
import type { ContentVersion } from "@/types/content-version";

const TONE_OPTIONS: GenerationTone[] = ["professional", "friendly", "enthusiastic", "direct"];
const LENGTH_OPTIONS: GenerationLength[] = ["short", "medium", "long"];
const SECTION_OPTIONS: { value: TextSection; label: string }[] = [
  { value: "hook", label: "Accroche" },
  { value: "intro", label: "Introduction" },
  { value: "body", label: "Corps" },
  { value: "conclusion", label: "Conclusion" },
  { value: "cta", label: "Appel à l'action" },
  { value: "hashtags", label: "Hashtags" },
  { value: "firstComment", label: "Premier commentaire" },
];
const ALL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "x", "youtube"];

const FIELD_CLASS =
  "rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 dark:border-white/[.08] dark:bg-zinc-950 dark:text-zinc-300";

interface AIGenerationPanelProps {
  defaultFormat: ContentFormat;
  currentVersion: ContentVersion | undefined;
  onGenerate: (params: {
    format: ContentFormat;
    tone: GenerationTone;
    length: GenerationLength;
    instructions: string;
  }) => void;
  onRegenerateSection: (section: TextSection, tone: GenerationTone, length: GenerationLength) => void;
  onShorten: () => void;
  onExpand: () => void;
  onSimplify: () => void;
  onChangeTone: (tone: GenerationTone) => void;
  onAdaptForPlatform: (platform: SocialPlatform) => void;
}

export function AIGenerationPanel({
  defaultFormat,
  currentVersion,
  onGenerate,
  onRegenerateSection,
  onShorten,
  onExpand,
  onSimplify,
  onChangeTone,
  onAdaptForPlatform,
}: AIGenerationPanelProps) {
  const [format, setFormat] = useState<ContentFormat>(defaultFormat);
  const [tone, setTone] = useState<GenerationTone>("professional");
  const [length, setLength] = useState<GenerationLength>("medium");
  const [instructions, setInstructions] = useState("");
  const [section, setSection] = useState<TextSection>("hook");
  const [transformTone, setTransformTone] = useState<GenerationTone>("friendly");
  const [transformPlatform, setTransformPlatform] = useState<SocialPlatform>("instagram");

  const isTextCurrent = currentVersion?.format === "text";

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-white/[.08] dark:bg-zinc-950">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Génération assistée</h2>
        <span className="text-xs text-zinc-400 dark:text-zinc-600">Simulation déterministe, sans IA réelle</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Format
          <select value={format} onChange={(event) => setFormat(event.target.value as ContentFormat)} className={FIELD_CLASS}>
            {CONTENT_FORMATS.map((value) => (
              <option key={value} value={value}>
                {FORMAT_LABEL[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Ton
          <select value={tone} onChange={(event) => setTone(event.target.value as GenerationTone)} className={FIELD_CLASS}>
            {TONE_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {TONE_LABEL[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Longueur
          <select value={length} onChange={(event) => setLength(event.target.value as GenerationLength)} className={FIELD_CLASS}>
            {LENGTH_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {LENGTH_LABEL[value]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Consigne complémentaire (optionnel)
        <textarea
          rows={2}
          value={instructions}
          onChange={(event) => setInstructions(event.target.value)}
          placeholder="Ex. insister sur la garantie satisfait ou remboursé"
          className={FIELD_CLASS}
        />
      </label>

      <button
        type="button"
        onClick={() => onGenerate({ format, tone, length, instructions })}
        className="w-fit rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40"
      >
        Générer avec l&apos;IA
      </button>

      {isTextCurrent && (
        <div className="flex flex-col gap-3 border-t border-zinc-100 pt-4 dark:border-white/[.06]">
          <div className="flex flex-wrap items-center gap-2">
            <select value={section} onChange={(event) => setSection(event.target.value as TextSection)} className={FIELD_CLASS}>
              {SECTION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onRegenerateSection(section, tone, length)}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-white/[.1] dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
            >
              Régénérer cette section
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onShorten}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-white/[.1] dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
            >
              Raccourcir
            </button>
            <button
              type="button"
              onClick={onExpand}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-white/[.1] dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
            >
              Développer
            </button>
            <button
              type="button"
              onClick={onSimplify}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-white/[.1] dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
            >
              Simplifier
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={transformTone}
              onChange={(event) => setTransformTone(event.target.value as GenerationTone)}
              className={FIELD_CLASS}
            >
              {TONE_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {TONE_LABEL[value]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onChangeTone(transformTone)}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-white/[.1] dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
            >
              Changer le ton
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={transformPlatform}
              onChange={(event) => setTransformPlatform(event.target.value as SocialPlatform)}
              className={FIELD_CLASS}
            >
              {ALL_PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {PLATFORM_LABEL[platform]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onAdaptForPlatform(transformPlatform)}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-white/[.1] dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
            >
              Adapter à ce réseau
            </button>
          </div>
        </div>
      )}

      {!isTextCurrent && currentVersion && (
        <p className="text-xs text-zinc-400 dark:text-zinc-600">
          La régénération par section et les transformations rapides ne sont disponibles que pour les
          versions au format texte.
        </p>
      )}
    </div>
  );
}
