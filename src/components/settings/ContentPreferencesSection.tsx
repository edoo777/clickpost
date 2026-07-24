import { platformIcons } from "@/components/icons";
import { CONTENT_FORMATS, FORMAT_LABEL } from "@/lib/editorial-constants";
import { PLATFORM_LABEL } from "@/lib/post-status";
import { LANGUAGE_OPTIONS } from "@/lib/settings-data";
import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";
import type { ContentPreferences } from "@/types/settings";

const ALL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "x", "youtube"];

const INPUT_CLASS =
  "w-full rounded-lg border border-black/[.08] bg-white px-3 py-2 text-sm text-zinc-800 disabled:bg-zinc-50 disabled:text-zinc-500 dark:border-white/[.08] dark:bg-zinc-950 dark:text-zinc-200 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-500";

function toggleClass(isSelected: boolean, editable: boolean): string {
  return `flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
    isSelected
      ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-black"
      : "border-black/[.08] text-zinc-600 dark:border-white/[.08] dark:text-zinc-400"
  } ${editable ? "cursor-pointer" : "cursor-default"}`;
}

interface ContentPreferencesSectionProps {
  content: ContentPreferences;
  editable: boolean;
  onChange: (content: ContentPreferences) => void;
}

export function ContentPreferencesSection({ content, editable, onChange }: ContentPreferencesSectionProps) {
  function set<K extends keyof ContentPreferences>(key: K, value: ContentPreferences[K]) {
    onChange({ ...content, [key]: value });
  }

  function togglePlatform(platform: SocialPlatform) {
    if (!editable) return;
    set(
      "defaultPlatforms",
      content.defaultPlatforms.includes(platform)
        ? content.defaultPlatforms.filter((p) => p !== platform)
        : [...content.defaultPlatforms, platform]
    );
  }

  function toggleFormat(format: ContentFormat) {
    if (!editable) return;
    set(
      "favoriteFormats",
      content.favoriteFormats.includes(format)
        ? content.favoriteFormats.filter((f) => f !== format)
        : [...content.favoriteFormats, format]
    );
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-black/[.08] bg-white p-5 dark:border-white/[.08] dark:bg-zinc-950">
      <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Préférences de contenu</h2>

      <label className="flex w-fit flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Langue de création par défaut
        <select
          disabled={!editable}
          value={content.defaultCreationLanguage}
          onChange={(event) => set("defaultCreationLanguage", event.target.value)}
          className={INPUT_CLASS}
        >
          {LANGUAGE_OPTIONS.map((language) => (
            <option key={language} value={language}>
              {language}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Réseaux sociaux proposés par défaut</span>
        <div className="flex flex-wrap gap-2">
          {ALL_PLATFORMS.map((platform) => {
            const Icon = platformIcons[platform];
            const isSelected = content.defaultPlatforms.includes(platform);
            return (
              <button
                key={platform}
                type="button"
                disabled={!editable}
                onClick={() => togglePlatform(platform)}
                className={toggleClass(isSelected, editable)}
              >
                <Icon className="h-3.5 w-3.5" />
                {PLATFORM_LABEL[platform]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Formats favoris</span>
        <div className="flex flex-wrap gap-2">
          {CONTENT_FORMATS.map((format) => {
            const isSelected = content.favoriteFormats.includes(format);
            return (
              <button
                key={format}
                type="button"
                disabled={!editable}
                onClick={() => toggleFormat(format)}
                className={toggleClass(isSelected, editable)}
              >
                {FORMAT_LABEL[format]}
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex w-fit flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Durée par défaut des campagnes (jours)
        <input
          type="number"
          min={1}
          disabled={!editable}
          value={content.defaultCampaignDurationDays}
          onChange={(event) => set("defaultCampaignDurationDays", Number(event.target.value))}
          className={INPUT_CLASS}
        />
      </label>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Hashtags récurrents (un par ligne)
          <textarea
            rows={2}
            disabled={!editable}
            value={content.recurringHashtags.join("\n")}
            onChange={(event) => set("recurringHashtags", event.target.value.split("\n"))}
            className={INPUT_CLASS}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Appels à l&apos;action récurrents (un par ligne)
          <textarea
            rows={2}
            disabled={!editable}
            value={content.recurringCtas.join("\n")}
            onChange={(event) => set("recurringCtas", event.target.value.split("\n"))}
            className={INPUT_CLASS}
          />
        </label>
      </div>
    </section>
  );
}
