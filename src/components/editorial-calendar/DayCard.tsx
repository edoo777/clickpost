import { ThemeEditor } from "@/components/editorial-calendar/ThemeEditor";
import { platformIcons } from "@/components/icons";
import { CONTENT_FORMATS, FORMAT_LABEL, WEEKDAY_LABEL } from "@/lib/editorial-constants";
import { PLATFORM_LABEL } from "@/lib/post-status";
import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat, EditorialDayPlan, EditorialTheme } from "@/types/editorial-calendar";

const ALL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "x"];

function toggleClass(isSelected: boolean, editable: boolean): string {
  return `flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
    isSelected
      ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-black"
      : "border-black/[.08] text-zinc-600 dark:border-white/[.08] dark:text-zinc-400"
  } ${editable ? "cursor-pointer" : "cursor-default"}`;
}

interface DayCardProps {
  plan: EditorialDayPlan;
  editable: boolean;
  onChange: (plan: EditorialDayPlan) => void;
}

export function DayCard({ plan, editable, onChange }: DayCardProps) {
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

  function updateTheme(id: string, theme: EditorialTheme) {
    onChange({ ...plan, themes: plan.themes.map((t) => (t.id === id ? theme : t)) });
  }

  function removeTheme(id: string) {
    onChange({ ...plan, themes: plan.themes.filter((t) => t.id !== id) });
  }

  function addTheme() {
    onChange({
      ...plan,
      themes: [...plan.themes, { id: crypto.randomUUID(), label: "", objective: "" }],
    });
  }

  return (
    <div
      className={`flex min-w-0 flex-col gap-3 rounded-xl border p-4 ${
        plan.enabled
          ? "border-black/[.08] bg-white dark:border-white/[.08] dark:bg-zinc-950"
          : "border-black/[.06] bg-zinc-50 dark:border-white/[.06] dark:bg-zinc-900/40"
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
          <div className="flex flex-col gap-2">
            {plan.themes.map((theme) => (
              <ThemeEditor
                key={theme.id}
                theme={theme}
                editable={editable}
                onChange={(t) => updateTheme(theme.id, t)}
                onRemove={() => removeTheme(theme.id)}
              />
            ))}
            {plan.themes.length === 0 && !editable && (
              <p className="text-xs text-zinc-400 dark:text-zinc-600">Aucune thématique définie.</p>
            )}
            {editable && (
              <button
                type="button"
                onClick={addTheme}
                className="w-fit rounded-lg border border-dashed border-black/[.16] px-2.5 py-1 text-xs font-medium text-zinc-500 hover:border-black/[.3] dark:border-white/[.16] dark:text-zinc-400"
              >
                + Ajouter une thématique
              </button>
            )}
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
              className="w-14 rounded-lg border border-black/[.08] bg-white px-2 py-1 text-center text-sm text-zinc-800 disabled:border-transparent disabled:bg-transparent dark:border-white/[.08] dark:bg-zinc-950 dark:text-zinc-200"
            />
          </label>
        </>
      )}
    </div>
  );
}
