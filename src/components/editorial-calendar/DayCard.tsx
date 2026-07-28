import { platformIcons } from "@/components/icons";
import { CONTENT_FORMATS, FORMAT_LABEL, WEEKDAY_LABEL } from "@/lib/editorial-constants";
import { PLATFORM_LABEL } from "@/lib/post-status";
import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat, EditorialDayPlan } from "@/types/editorial-calendar";
import type { Theme } from "@/types/theme";

const ALL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "x"];

function toggleClass(isSelected: boolean, editable: boolean): string {
  return `flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
    isSelected
      ? "border-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm shadow-fuchsia-500/20"
      : "border-zinc-200 text-zinc-600 dark:border-white/[.08] dark:text-zinc-400"
  } ${editable ? "cursor-pointer" : "cursor-default"}`;
}

interface DayCardProps {
  plan: EditorialDayPlan;
  themes: Theme[];
  editable: boolean;
  onChange: (plan: EditorialDayPlan) => void;
}

export function DayCard({ plan, themes, editable, onChange }: DayCardProps) {
  function toggleEnabled() {
    if (!editable) return;
    onChange({ ...plan, enabled: !plan.enabled });
  }

  function togglePlatform(platform: SocialPlatform) {
    if (!editable) return;
    onChange({
      ...plan,
      platforms: plan.platforms.includes(platform)
        ? plan.platforms.filter((p) => p !== platform)
        : [...plan.platforms, platform],
    });
  }

  function toggleFormat(format: ContentFormat) {
    if (!editable) return;
    onChange({
      ...plan,
      formats: plan.formats.includes(format)
        ? plan.formats.filter((f) => f !== format)
        : [...plan.formats, format],
    });
  }

  function toggleTheme(themeId: string) {
    if (!editable) return;
    onChange({
      ...plan,
      themeIds: plan.themeIds.includes(themeId)
        ? plan.themeIds.filter((id) => id !== themeId)
        : [...plan.themeIds, themeId],
    });
  }

  return (
    <div
      className={`flex min-w-0 flex-col gap-3 rounded-xl border p-4 ${
        plan.enabled
          ? "border-zinc-200 bg-white dark:border-white/[.08] dark:bg-zinc-950"
          : "border-zinc-100 bg-zinc-50 dark:border-white/[.06] dark:bg-zinc-900/40"
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          {WEEKDAY_LABEL[plan.day]}
        </h3>
        <button
          type="button"
          disabled={!editable}
          onClick={toggleEnabled}
          aria-label={plan.enabled ? "Désactiver la journée" : "Activer la journée"}
          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
            plan.enabled ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
          } ${editable ? "cursor-pointer" : "cursor-default"}`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
              plan.enabled ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {!plan.enabled ? (
        <p className="text-xs text-zinc-400 dark:text-zinc-600">Jour désactivé</p>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Thématiques</span>
            <div className="flex flex-wrap gap-1.5">
              {themes.map((theme) => {
                const isSelected = plan.themeIds.includes(theme.id);
                if (!editable && !isSelected) return null;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    disabled={!editable}
                    onClick={() => toggleTheme(theme.id)}
                    title={theme.objective || undefined}
                    className={toggleClass(isSelected, editable)}
                  >
                    {theme.label || "Sans titre"}
                  </button>
                );
              })}
              {themes.length === 0 && (
                <span className="text-xs text-zinc-400 dark:text-zinc-600">
                  Aucune thématique active pour cette marque — gérez-les dans « Thématiques ».
                </span>
              )}
              {themes.length > 0 && !editable && plan.themeIds.length === 0 && (
                <span className="text-xs text-zinc-400 dark:text-zinc-600">—</span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Réseaux</span>
            <div className="flex flex-wrap gap-1.5">
              {ALL_PLATFORMS.map((platform) => {
                const Icon = platformIcons[platform];
                const isSelected = plan.platforms.includes(platform);
                if (!editable && !isSelected) return null;
                return (
                  <button
                    key={platform}
                    type="button"
                    disabled={!editable}
                    onClick={() => togglePlatform(platform)}
                    className={toggleClass(isSelected, editable)}
                  >
                    <Icon className="h-3 w-3" />
                    {PLATFORM_LABEL[platform]}
                  </button>
                );
              })}
              {!editable && plan.platforms.length === 0 && (
                <span className="text-xs text-zinc-400 dark:text-zinc-600">—</span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Formats</span>
            <div className="flex flex-wrap gap-1.5">
              {CONTENT_FORMATS.map((format) => {
                const isSelected = plan.formats.includes(format);
                if (!editable && !isSelected) return null;
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
              {!editable && plan.formats.length === 0 && (
                <span className="text-xs text-zinc-400 dark:text-zinc-600">—</span>
              )}
            </div>
          </div>

          <label className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Fréquence (publications/jour)
            <input
              type="number"
              min={0}
              max={5}
              disabled={!editable}
              value={plan.frequency}
              onChange={(event) => onChange({ ...plan, frequency: Number(event.target.value) })}
              className="w-14 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-center text-sm text-zinc-800 disabled:border-transparent disabled:bg-transparent dark:border-white/[.08] dark:bg-zinc-950 dark:text-zinc-200"
            />
          </label>
        </>
      )}
    </div>
  );
}
