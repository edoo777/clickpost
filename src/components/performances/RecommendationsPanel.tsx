interface RecommendationsPanelProps {
  recommendations: string[];
}

export function RecommendationsPanel({ recommendations }: RecommendationsPanelProps) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5  ">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-foreground ">Recommandations</h2>
        <p className="text-xs text-muted-foreground ">
          Générées automatiquement à partir des données de cette période, en mode démonstration.
        </p>
      </div>
      <ul className="flex flex-col gap-2">
        {recommendations.map((text) => (
          <li
            key={text}
            className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900 dark:bg-blue-500/10 dark:text-blue-200"
          >
            {text}
          </li>
        ))}
      </ul>
    </section>
  );
}
