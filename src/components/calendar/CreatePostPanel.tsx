import { connectedAccounts } from "@/lib/demo-data";
import { PLATFORM_LABEL } from "@/lib/post-status";

const INPUT_CLASS =
  "w-full rounded-lg border border-black/[.08] bg-zinc-50 px-3 py-2 text-sm text-zinc-500 dark:border-white/[.08] dark:bg-zinc-900 dark:text-zinc-400";

interface CreatePostPanelProps {
  onClose: () => void;
}

export function CreatePostPanel({ onClose }: CreatePostPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Fermer le panneau"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
      />
      <div className="relative flex h-full w-full max-w-md flex-col gap-5 overflow-y-auto bg-white p-6 shadow-xl dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Créer une publication
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            ✕
          </button>
        </div>

        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
          Aperçu d&apos;interface — la création réelle de publications arrivera dans une prochaine
          itération.
        </p>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Compte social
            <select disabled className={INPUT_CLASS}>
              {connectedAccounts.map((account) => (
                <option key={account.id}>
                  {account.handle} · {PLATFORM_LABEL[account.platform]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Date et heure
            <input type="datetime-local" disabled className={INPUT_CLASS} />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Contenu
            <textarea
              disabled
              rows={5}
              placeholder="Rédigez le contenu de la publication…"
              className={INPUT_CLASS}
            />
          </label>
        </div>

        <div className="mt-auto flex gap-3 border-t border-black/[.06] pt-4 dark:border-white/[.06]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-black/[.08] px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:border-white/[.08] dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled
            className="flex-1 cursor-not-allowed rounded-lg bg-zinc-300 px-4 py-2 text-sm font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-600"
          >
            Créer (bientôt disponible)
          </button>
        </div>
      </div>
    </div>
  );
}
