"use client";

import type { ReactNode } from "react";
import { platformIcons } from "@/components/icons";
import { ALL_CONTENT_TYPES, CONTENT_TYPE_LABEL, type ContentType } from "@/lib/content-types";
import { CONTENT_FORMATS, useFormatLabel } from "@/lib/editorial-constants";
import { usePlatformLabel } from "@/lib/post-status";
import type { Brand, ContentExample } from "@/types/brand";
import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";

const ALL_PLATFORMS: SocialPlatform[] = [
  "instagram",
  "facebook",
  "linkedin",
  "tiktok",
  "youtube",
  "x",
  "threads",
  "pinterest",
  "other",
];

const INPUT_CLASS =
  "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-zinc-800 disabled:bg-background disabled:text-zinc-500   dark:text-zinc-200 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-500";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5  ">
      <h2 className="text-sm font-semibold text-foreground ">{title}</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function TextField({
  label,
  value,
  editable,
  multiline,
  onChange,
}: {
  label: string;
  value: string;
  editable: boolean;
  multiline?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
      {label}
      {multiline ? (
        <textarea
          rows={3}
          disabled={!editable}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={INPUT_CLASS}
        />
      ) : (
        <input
          disabled={!editable}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={INPUT_CLASS}
        />
      )}
    </label>
  );
}

function ListField({
  label,
  value,
  editable,
  onChange,
}: {
  label: string;
  value: string[];
  editable: boolean;
  onChange: (value: string[]) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
      {label}
      <textarea
        rows={3}
        disabled={!editable}
        value={value.join("\n")}
        placeholder="Une valeur par ligne"
        onChange={(event) => onChange(event.target.value.split("\n"))}
        className={INPUT_CLASS}
      />
    </label>
  );
}

function PlatformField({
  value,
  editable,
  onChange,
}: {
  value: SocialPlatform[];
  editable: boolean;
  onChange: (value: SocialPlatform[]) => void;
}) {
  function toggle(platform: SocialPlatform) {
    if (!editable) return;
    onChange(value.includes(platform) ? value.filter((p) => p !== platform) : [...value, platform]);
  }

  const PLATFORM_LABEL = usePlatformLabel();

  return (
    <div className="flex flex-wrap gap-2">
      {ALL_PLATFORMS.map((platform) => {
        const Icon = platformIcons[platform];
        const isSelected = value.includes(platform);
        return (
          <button
            key={platform}
            type="button"
            disabled={!editable}
            onClick={() => toggle(platform)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              isSelected
                ? "border-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm shadow-fuchsia-500/20"
                : "border-border text-zinc-600  dark:text-zinc-400"
            } ${editable ? "cursor-pointer" : "cursor-default"}`}
          >
            <Icon className="h-3.5 w-3.5" />
            {PLATFORM_LABEL[platform]}
          </button>
        );
      })}
    </div>
  );
}

function NumberField({
  label,
  value,
  editable,
  onChange,
}: {
  label: string;
  value: number;
  editable: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
      {label}
      <input
        type="number"
        min={0}
        disabled={!editable}
        value={value || ""}
        placeholder="0"
        onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))}
        className={INPUT_CLASS}
      />
    </label>
  );
}

function ChipMultiSelect<T extends string>({
  label,
  value,
  options,
  labels,
  editable,
  onChange,
}: {
  label: string;
  value: T[];
  options: T[];
  labels: Record<T, string>;
  editable: boolean;
  onChange: (value: T[]) => void;
}) {
  function toggle(option: T) {
    if (!editable) return;
    onChange(value.includes(option) ? value.filter((item) => item !== option) : [...value, option]);
  }

  return (
    <div className="col-span-1 flex flex-col gap-1.5 md:col-span-2">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = value.includes(option);
          return (
            <button
              key={option}
              type="button"
              disabled={!editable}
              onClick={() => toggle(option)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                isSelected
                  ? "border-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm shadow-fuchsia-500/20"
                  : "border-border text-zinc-600 dark:text-zinc-400"
              } ${editable ? "cursor-pointer" : "cursor-default"}`}
            >
              {labels[option]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ContentExamplesField({
  value,
  editable,
  onChange,
}: {
  value: ContentExample[];
  editable: boolean;
  onChange: (value: ContentExample[]) => void;
}) {
  function updateExample(id: string, patch: Partial<ContentExample>) {
    onChange(value.map((example) => (example.id === id ? { ...example, ...patch } : example)));
  }

  function removeExample(id: string) {
    onChange(value.filter((example) => example.id !== id));
  }

  function addExample() {
    onChange([...value, { id: crypto.randomUUID(), platform: "instagram", title: "", excerpt: "" }]);
  }

  const PLATFORM_LABEL = usePlatformLabel();

  return (
    <div className="col-span-1 flex flex-col gap-3 md:col-span-2">
      {value.map((example) => {
        const Icon = platformIcons[example.platform];
        return (
          <div key={example.id} className="flex flex-col gap-2 rounded-lg border border-border p-3 ">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground " />
              <select
                disabled={!editable}
                value={example.platform}
                onChange={(event) => updateExample(example.id, { platform: event.target.value as SocialPlatform })}
                className={`${INPUT_CLASS} w-auto`}
              >
                {ALL_PLATFORMS.map((platform) => (
                  <option key={platform} value={platform}>
                    {PLATFORM_LABEL[platform]}
                  </option>
                ))}
              </select>
              {editable && (
                <button
                  type="button"
                  onClick={() => removeExample(example.id)}
                  className="ml-auto text-xs font-medium text-red-500 hover:underline"
                >
                  Supprimer
                </button>
              )}
            </div>
            <input
              disabled={!editable}
              value={example.title}
              placeholder="Titre"
              onChange={(event) => updateExample(example.id, { title: event.target.value })}
              className={INPUT_CLASS}
            />
            <textarea
              disabled={!editable}
              rows={2}
              value={example.excerpt}
              placeholder="Extrait du contenu"
              onChange={(event) => updateExample(example.id, { excerpt: event.target.value })}
              className={INPUT_CLASS}
            />
          </div>
        );
      })}
      {editable && (
        <button
          type="button"
          onClick={addExample}
          className="w-fit rounded-lg border border-dashed border-zinc-400 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-zinc-500 dark:border-white/[.16] "
        >
          + Ajouter un exemple
        </button>
      )}
      {value.length === 0 && !editable && <p className="text-sm text-muted-foreground ">Aucun exemple renseigné.</p>}
    </div>
  );
}

export type BrandProfileSection = "identity" | "positioning" | "editorial";

interface BrandProfileFormProps {
  profile: Brand;
  editable: boolean;
  onChange: (profile: Brand) => void;
  /** Limite le formulaire aux sections pertinentes pour l'onglet actif de la fiche de marque. */
  section: BrandProfileSection;
}

export function BrandProfileForm({ profile, editable, onChange, section }: BrandProfileFormProps) {
  const FORMAT_LABEL = useFormatLabel();

  function set<K extends keyof Brand>(key: K, value: Brand[K]) {
    onChange({ ...profile, [key]: value });
  }

  return (
    <div className="flex flex-col gap-4">
      {section === "identity" && (
        <>
          <Section title="Identité">
            <TextField label="Nom de la marque" value={profile.name} editable={editable} onChange={(v) => set("name", v)} />
            <TextField label="Site Web (optionnel)" value={profile.website ?? ""} editable={editable} onChange={(v) => set("website", v)} />
            <div className="md:col-span-2">
              <TextField label="Description" value={profile.description} editable={editable} multiline onChange={(v) => set("description", v)} />
            </div>
            <div className="md:col-span-2">
              <ListField label="Produits et services" value={profile.productsAndServices} editable={editable} onChange={(v) => set("productsAndServices", v)} />
            </div>
          </Section>

          <Section title="Image de marque">
            <TextField label="Logo — URL (optionnel)" value={profile.logoUrl ?? ""} editable={editable} onChange={(v) => set("logoUrl", v)} />
            <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Couleur de marque (optionnel)
              <input
                type="color"
                disabled={!editable}
                value={profile.colorPrimary || "#7c3aed"}
                onChange={(event) => set("colorPrimary", event.target.value)}
                className={`${INPUT_CLASS} h-10 p-1`}
              />
            </label>
          </Section>
        </>
      )}

      {section === "positioning" && (
        <>
          <Section title="Niche">
            <TextField label="Niche (secteur général)" value={profile.industry} editable={editable} onChange={(v) => set("industry", v)} />
            <TextField label="Sous-niche (optionnel)" value={profile.subNiche ?? ""} editable={editable} onChange={(v) => set("subNiche", v)} />
            <TextField label="Pays / marché (optionnel)" value={profile.market ?? ""} editable={editable} onChange={(v) => set("market", v)} />
          </Section>

          <Section title="Positionnement">
            <div className="md:col-span-2">
              <TextField label="Positionnement" value={profile.positioning ?? ""} editable={editable} multiline onChange={(v) => set("positioning", v)} />
            </div>
            <div className="md:col-span-2">
              <TextField
                label="Proposition de valeur"
                value={profile.valueProposition ?? ""}
                editable={editable}
                multiline
                onChange={(v) => set("valueProposition", v)}
              />
            </div>
          </Section>

          <Section title="Audience & objectifs">
            <div className="md:col-span-2">
              <TextField label="Clientèle cible" value={profile.targetAudience} editable={editable} multiline onChange={(v) => set("targetAudience", v)} />
            </div>
            <div className="md:col-span-2">
              <ListField
                label="Problèmes de l'audience"
                value={profile.audiencePainPoints}
                editable={editable}
                onChange={(v) => set("audiencePainPoints", v)}
              />
            </div>
            <div className="md:col-span-2">
              <ListField label="Objectifs de communication" value={profile.communicationGoals} editable={editable} onChange={(v) => set("communicationGoals", v)} />
            </div>
            <div className="md:col-span-2">
              <ListField label="Indicateurs de réussite" value={profile.successMetrics} editable={editable} onChange={(v) => set("successMetrics", v)} />
            </div>
          </Section>

          <Section title="Ton & langues">
            <TextField label="Ton de voix" value={profile.toneOfVoice} editable={editable} multiline onChange={(v) => set("toneOfVoice", v)} />
            <ListField label="Langues utilisées" value={profile.languages} editable={editable} onChange={(v) => set("languages", v)} />
          </Section>

          <Section title="Rythme de publication">
            <TextField
              label="Fréquence visée (ex. « 3 fois par semaine »)"
              value={profile.publishingFrequency ?? ""}
              editable={editable}
              onChange={(v) => set("publishingFrequency", v)}
            />
            <NumberField
              label="Objectif mensuel de publications"
              value={profile.monthlyPublishingGoal ?? 0}
              editable={editable}
              onChange={(v) => set("monthlyPublishingGoal", v)}
            />
          </Section>
        </>
      )}

      {section === "editorial" && (
        <>
          <Section title="Sujets & mots-clés">
            <ListField label="Sujets prioritaires" value={profile.priorityTopics} editable={editable} onChange={(v) => set("priorityTopics", v)} />
            <ListField label="Sujets à éviter" value={profile.topicsToAvoid} editable={editable} onChange={(v) => set("topicsToAvoid", v)} />
            <ListField label="Mots et expressions à privilégier" value={profile.preferredPhrases} editable={editable} onChange={(v) => set("preferredPhrases", v)} />
            <ListField label="Mots interdits" value={profile.forbiddenWords} editable={editable} onChange={(v) => set("forbiddenWords", v)} />
            <div className="md:col-span-2">
              <ListField label="Appels à l'action préférés" value={profile.preferredCtas} editable={editable} onChange={(v) => set("preferredCtas", v)} />
            </div>
          </Section>

          <Section title="Réseaux utilisés">
            <div className="md:col-span-2">
              <PlatformField value={profile.socialPlatforms} editable={editable} onChange={(v) => set("socialPlatforms", v)} />
            </div>
          </Section>

          <Section title="Contenu privilégié">
            <ChipMultiSelect<ContentType>
              label="Types de contenu privilégiés"
              value={profile.preferredContentTypes}
              options={ALL_CONTENT_TYPES}
              labels={CONTENT_TYPE_LABEL}
              editable={editable}
              onChange={(v) => set("preferredContentTypes", v)}
            />
            <ChipMultiSelect<ContentFormat>
              label="Formats privilégiés"
              value={profile.preferredFormats}
              options={CONTENT_FORMATS}
              labels={FORMAT_LABEL}
              editable={editable}
              onChange={(v) => set("preferredFormats", v)}
            />
          </Section>

          <Section title="Exemples de contenus représentatifs">
            <ContentExamplesField value={profile.contentExamples} editable={editable} onChange={(v) => set("contentExamples", v)} />
          </Section>
        </>
      )}
    </div>
  );
}
