import { IconLightbulb } from "@/components/icons";

export interface IdeaBankBlock {
  title: string;
  theme: string;
  topicsLabel: string;
}

/**
 * Reconstruction CSS de la banque d'idées ClickPost — blocs par thématique avec nombre de sujets,
 * utilisée pour les étapes "Capturer" et "Organiser" de /solution. Jamais une image : une vraie
 * composition d'interface, cohérente avec le produit réel (organisation par marque/thématique).
 */
export function IdeaBankMockup({ blocks, className = "" }: { blocks: IdeaBankBlock[]; className?: string }) {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {blocks.map((block, index) => (
        <div
          key={block.title}
          className="accent-halo flex items-center gap-4 rounded-2xl border border-border bg-surface p-4"
          style={{ marginLeft: index % 2 === 1 ? "1.5rem" : 0 }}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600">
            <IconLightbulb className="h-5 w-5 text-white" />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-sm font-semibold uppercase tracking-wide text-foreground">{block.title}</span>
            <span className="truncate text-xs text-muted-foreground">{block.theme}</span>
          </div>
          <span className="ml-auto shrink-0 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-400">
            {block.topicsLabel}
          </span>
        </div>
      ))}
    </div>
  );
}
