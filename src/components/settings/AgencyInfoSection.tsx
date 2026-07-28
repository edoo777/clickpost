import { COUNTRY_OPTIONS, LANGUAGE_OPTIONS, TIME_ZONE_OPTIONS } from "@/lib/settings-data";
import type { AgencyInfo } from "@/types/settings";

const INPUT_CLASS =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 disabled:bg-zinc-50 disabled:text-zinc-500 dark:border-white/[.08] dark:bg-zinc-950 dark:text-zinc-200 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-500";

interface AgencyInfoSectionProps {
  info: AgencyInfo;
  editable: boolean;
  onChange: (info: AgencyInfo) => void;
}

export function AgencyInfoSection({ info, editable, onChange }: AgencyInfoSectionProps) {
  function set<K extends keyof AgencyInfo>(key: K, value: AgencyInfo[K]) {
    onChange({ ...info, [key]: value });
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-white/[.08] dark:bg-zinc-950">
      <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Informations de l&apos;agence</h2>

      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-black">
          {info.logoLabel || "?"}
        </span>
        <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Logo (simulé — initiales affichées, aucun téléversement réel)
          <input
            disabled={!editable}
            value={info.logoLabel}
            maxLength={3}
            onChange={(event) => set("logoLabel", event.target.value.toUpperCase())}
            className={INPUT_CLASS}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Nom de l&apos;agence
          <input disabled={!editable} value={info.name} onChange={(event) => set("name", event.target.value)} className={INPUT_CLASS} />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Site web
          <input disabled={!editable} value={info.website} onChange={(event) => set("website", event.target.value)} className={INPUT_CLASS} />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Email principal
          <input
            type="email"
            disabled={!editable}
            value={info.email}
            onChange={(event) => set("email", event.target.value)}
            className={INPUT_CLASS}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Téléphone
          <input disabled={!editable} value={info.phone} onChange={(event) => set("phone", event.target.value)} className={INPUT_CLASS} />
        </label>

        <div className="md:col-span-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Adresse
            <input
              disabled={!editable}
              value={info.address}
              onChange={(event) => set("address", event.target.value)}
              className={INPUT_CLASS}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Pays
          <select disabled={!editable} value={info.country} onChange={(event) => set("country", event.target.value)} className={INPUT_CLASS}>
            {COUNTRY_OPTIONS.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Langue par défaut
          <select
            disabled={!editable}
            value={info.defaultLanguage}
            onChange={(event) => set("defaultLanguage", event.target.value)}
            className={INPUT_CLASS}
          >
            {LANGUAGE_OPTIONS.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Fuseau horaire par défaut
          <select
            disabled={!editable}
            value={info.defaultTimeZone}
            onChange={(event) => set("defaultTimeZone", event.target.value)}
            className={INPUT_CLASS}
          >
            {TIME_ZONE_OPTIONS.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
