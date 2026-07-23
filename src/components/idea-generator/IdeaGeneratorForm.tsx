import { platformIcons } from "@/components/icons";
import { brandProfiles } from "@/lib/brand-profiles";
import { PLATFORM_LABEL } from "@/lib/post-status";
import type { SocialPlatform } from "@/types/dashboard";
import type { PeriodType } from "@/types/idea-generator";

const ALL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "x"];

const FIELD_CLASS =
  "rounded-lg border border-black/[.08] bg-white px-3 py-1.5 text-sm text-zinc-700 dark:border-white/[.08] dark:bg-zinc-950 dark:text-zinc-300";

export interface IdeaGeneratorFormValue {
  brandId: string;
  periodType: PeriodType;
  startDate: string;
  platforms: SocialPlatform[];
  count: number;
}

interface IdeaGeneratorFormProps {
  value: IdeaGeneratorFormValue;
  onChange: (value: IdeaGeneratorFormValue) => void;
  onGenerate: () => void;
}

export function IdeaGeneratorForm({ value, onChange, onGenerate }: IdeaGeneratorFormProps) {
  function togglePlatform(platform: SocialPlatform) {
    onChange({
      ...value,
      platforms: value.platforms.includes(platform)
        ? value.platforms.filter((p) => p !== platform)
        : [...value.platforms, platform],
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-black/[.08] bg-white p-5 dark:border-white/[.08] dark:bg-zinc-950">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Marque
          <select
            value={value.brandId}
            onChange={(event) => onChange({ ...value, brandId: event.target.value })}
            className={FIELD_CLASS}
          >
            {brandProfiles.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Période
          <select
            value={value.periodType}
            onChange={(event) =>
              onChange({ ...value, periodType: event.target.value as PeriodType })
            }
            className={FIELD_CLASS}
          >
            <option value="week">Semaine</option>
            <option value="month">Mois</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Date de départ
          <input
            type="date"
            value={value.startDate}
            onChange={(event) => onChange({ ...value, startDate: event.target.value })}
            className={FIELD_CLASS}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Nombre d&apos;idées
          <input
            type="number"
            min={1}
            max={20}
            value={value.count}
            onChange={(event) => onChange({ ...value, count: Number(event.target.value) })}
            className={FIELD_CLASS}
          />
        </label>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Réseaux concernés
        </span>
        <div className="flex flex-wrap gap-2">
          {ALL_PLATFORMS.map((platform) => {
            const Icon = platformIcons[platform];
            const isSelected = value.platforms.includes(platform);
            return (
              <button
                key={platform}
                type="button"
                onClick={() => togglePlatform(platform)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  isSelected
                    ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-black"
                    : "border-black/[.08] text-zinc-600 dark:border-white/[.08] dark:text-zinc-400"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {PLATFORM_LABEL[platform]}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={onGenerate}
        className="w-fit rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
      >
        Générer des idées
      </button>
    </div>
  );
}
