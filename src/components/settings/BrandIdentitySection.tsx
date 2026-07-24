import type { BrandIdentity } from "@/types/settings";

interface BrandIdentitySectionProps {
  identity: BrandIdentity;
  editable: boolean;
  onChange: (identity: BrandIdentity) => void;
  onReset: () => void;
}

export function BrandIdentitySection({ identity, editable, onChange, onReset }: BrandIdentitySectionProps) {
  function set<K extends keyof BrandIdentity>(key: K, value: BrandIdentity[K]) {
    onChange({ ...identity, [key]: value });
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-black/[.08] bg-white p-5 dark:border-white/[.08] dark:bg-zinc-950">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Identité visuelle</h2>
        {editable && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-medium text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
          >
            Restaurer les valeurs par défaut
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Couleur principale
          <div className="flex items-center gap-2">
            <input
              type="color"
              disabled={!editable}
              value={identity.primaryColor}
              onChange={(event) => set("primaryColor", event.target.value)}
              className="h-9 w-14 rounded border border-black/[.08] bg-white dark:border-white/[.08] dark:bg-zinc-950"
            />
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{identity.primaryColor}</span>
          </div>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Couleur secondaire
          <div className="flex items-center gap-2">
            <input
              type="color"
              disabled={!editable}
              value={identity.secondaryColor}
              onChange={(event) => set("secondaryColor", event.target.value)}
              className="h-9 w-14 rounded border border-black/[.08] bg-white dark:border-white/[.08] dark:bg-zinc-950"
            />
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{identity.secondaryColor}</span>
          </div>
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Aperçu de l&apos;interface personnalisée
        </span>
        <div
          className="flex overflow-hidden rounded-lg border border-black/[.08] dark:border-white/[.08]"
          style={{ height: 120 }}
        >
          <div className="flex w-24 flex-col gap-2 p-3" style={{ backgroundColor: identity.primaryColor }}>
            <span className="h-2 w-12 rounded-full bg-white/70" />
            <span className="h-2 w-16 rounded-full bg-white/40" />
            <span className="h-2 w-10 rounded-full bg-white/40" />
          </div>
          <div className="flex flex-1 flex-col justify-between bg-white p-3 dark:bg-zinc-900">
            <div className="flex flex-col gap-1.5">
              <span className="h-2 w-24 rounded-full bg-zinc-200 dark:bg-zinc-700" />
              <span className="h-2 w-32 rounded-full bg-zinc-100 dark:bg-zinc-800" />
            </div>
            <span
              className="w-fit rounded-lg px-3 py-1.5 text-xs font-medium text-white"
              style={{ backgroundColor: identity.secondaryColor }}
            >
              Bouton d&apos;action
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
