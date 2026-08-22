import { IconSparkles, IconWand } from "@/components/icons";

/**
 * Reconstruction CSS d'une génération de sujets par l'IA ClickPost — bulle de demande utilisateur
 * puis liste de sujets qui "arrivent" dans l'interface, pour l'étape "Générer" de /solution.
 */
export function AiGenerationMockup({ prompt, topics, className = "" }: { prompt: string; topics: string[]; className?: string }) {
  return (
    <div className={`accent-halo flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 ${className}`}>
      <div className="flex items-start justify-end gap-2">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-medium text-white">
          {prompt}
        </div>
      </div>
      <div className="flex items-start gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600">
          <IconWand className="h-3.5 w-3.5 text-white" />
        </span>
        <div className="flex flex-1 flex-col gap-1.5 rounded-2xl rounded-tl-sm border border-border bg-muted/50 p-3">
          {topics.map((topic, index) => (
            <div key={topic} className="marketing-reveal is-visible flex items-center gap-2 text-sm text-foreground/90" style={{ animationDelay: `${index * 90}ms` }}>
              <IconSparkles className="h-3.5 w-3.5 shrink-0 text-fuchsia-600 dark:text-fuchsia-400" />
              {topic}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
