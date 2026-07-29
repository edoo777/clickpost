"use client";

import type { ReactNode } from "react";
import { platformIcons } from "@/components/icons";
import { PLATFORM_LABEL } from "@/lib/post-status";
import type { Brand, ContentExample } from "@/types/brand";
import type { SocialPlatform } from "@/types/dashboard";

const ALL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "x"];

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
    onChange(
      value.includes(platform) ? value.filter((p) => p !== platform) : [...value, platform]
    );
  }

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

  return (
    <div className="col-span-1 flex flex-col gap-3 md:col-span-2">
      {value.map((example) => {
        const Icon = platformIcons[example.platform];
        return (
          <div
            key={example.id}
            className="flex flex-col gap-2 rounded-lg border border-border p-3 "
          >
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground " />
              <select
                disabled={!editable}
                value={example.platform}
                onChange={(event) =>
                  updateExample(example.id, { platform: event.target.value as SocialPlatform })
                }
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
      {value.length === 0 && !editable && (
        <p className="text-sm text-muted-foreground ">Aucun exemple renseigné.</p>
      )}
    </div>
  );
}

interface BrandProfileFormProps {
  profile: Brand;
  editable: boolean;
  onChange: (profile: Brand) => void;
}

export function BrandProfileForm({ profile, editable, onChange }: BrandProfileFormProps) {
  function set<K extends keyof Brand>(key: K, value: Brand[K]) {
    onChange({ ...profile, [key]: value });
  }

  return (
    <div className="flex flex-col gap-4">
      <Section title="Identité">
        <TextField
          label="Nom de la marque"
          value={profile.name}
          editable={editable}
          onChange={(v) => set("name", v)}
        />
        <TextField
          label="Secteur d'activité"
          value={profile.industry}
          editable={editable}
          onChange={(v) => set("industry", v)}
        />
        <div className="md:col-span-2">
          <TextField
            label="Description de l'entreprise"
            value={profile.description}
            editable={editable}
            multiline
            onChange={(v) => set("description", v)}
          />
        </div>
        <div className="md:col-span-2">
          <ListField
            label="Produits et services"
            value={profile.productsAndServices}
            editable={editable}
            onChange={(v) => set("productsAndServices", v)}
          />
        </div>
      </Section>

      <Section title="Audience & objectifs">
        <div className="md:col-span-2">
          <TextField
            label="Clientèle cible"
            value={profile.targetAudience}
            editable={editable}
            multiline
            onChange={(v) => set("targetAudience", v)}
          />
        </div>
        <div className="md:col-span-2">
          <ListField
            label="Objectifs de communication"
            value={profile.communicationGoals}
            editable={editable}
            onChange={(v) => set("communicationGoals", v)}
          />
        </div>
      </Section>

      <Section title="Ton & langues">
        <TextField
          label="Ton de voix"
          value={profile.toneOfVoice}
          editable={editable}
          multiline
          onChange={(v) => set("toneOfVoice", v)}
        />
        <ListField
          label="Langues utilisées"
          value={profile.languages}
          editable={editable}
          onChange={(v) => set("languages", v)}
        />
      </Section>

      <Section title="Sujets & mots-clés">
        <ListField
          label="Sujets prioritaires"
          value={profile.priorityTopics}
          editable={editable}
          onChange={(v) => set("priorityTopics", v)}
        />
        <ListField
          label="Sujets à éviter"
          value={profile.topicsToAvoid}
          editable={editable}
          onChange={(v) => set("topicsToAvoid", v)}
        />
        <ListField
          label="Mots et expressions à privilégier"
          value={profile.preferredPhrases}
          editable={editable}
          onChange={(v) => set("preferredPhrases", v)}
        />
        <ListField
          label="Mots interdits"
          value={profile.forbiddenWords}
          editable={editable}
          onChange={(v) => set("forbiddenWords", v)}
        />
        <div className="md:col-span-2">
          <ListField
            label="Appels à l'action préférés"
            value={profile.preferredCtas}
            editable={editable}
            onChange={(v) => set("preferredCtas", v)}
          />
        </div>
      </Section>

      <Section title="Réseaux utilisés">
        <div className="md:col-span-2">
          <PlatformField
            value={profile.socialPlatforms}
            editable={editable}
            onChange={(v) => set("socialPlatforms", v)}
          />
        </div>
      </Section>

      <Section title="Exemples de contenus représentatifs">
        <ContentExamplesField
          value={profile.contentExamples}
          editable={editable}
          onChange={(v) => set("contentExamples", v)}
        />
      </Section>
    </div>
  );
}
