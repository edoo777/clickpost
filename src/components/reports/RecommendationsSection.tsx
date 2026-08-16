import { RECOMMENDATION_CATEGORY_LABEL, type RecommendationCategory, type ReportRecommendation } from "@/types/report";

const CATEGORY_ORDER: RecommendationCategory[] = ["continue", "improve", "test", "stop"];

const CATEGORY_STYLE: Record<RecommendationCategory, string> = {
  continue: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400",
  improve: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400",
  test: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-400",
  stop: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400",
};

/** Recommandations stratégiques catégorisées — toujours une interprétation Claude, jamais une
 * donnée mesurée. Texte éditable avant enregistrement du rapport. */
export function RecommendationsSection({
  recommendations,
  editable,
  onChange,
}: {
  recommendations: ReportRecommendation[];
  editable: boolean;
  onChange: (next: ReportRecommendation[]) => void;
}) {
  function handleTextChange(index: number, text: string) {
    onChange(recommendations.map((item, i) => (i === index ? { ...item, text } : item)));
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold text-foreground">Recommandations stratégiques</h2>
      {recommendations.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune recommandation disponible.</p>
      ) : (
        CATEGORY_ORDER.map((category) => {
          const items = recommendations
            .map((item, index) => ({ item, index }))
            .filter(({ item }) => item.category === category);
          if (items.length === 0) return null;
          return (
            <div key={category} className="flex flex-col gap-2">
              <span className={`w-fit rounded-full border px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_STYLE[category]}`}>
                {RECOMMENDATION_CATEGORY_LABEL[category]}
              </span>
              <ul className="flex flex-col gap-2">
                {items.map(({ item, index }) =>
                  editable ? (
                    <li key={index}>
                      <textarea
                        value={item.text}
                        onChange={(event) => handleTextChange(index, event.target.value)}
                        rows={2}
                        className="w-full resize-none rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground focus:border-violet-300 focus:outline-none"
                      />
                    </li>
                  ) : (
                    <li key={index} className="rounded-lg bg-muted px-3 py-2 text-sm text-foreground">
                      {item.text}
                    </li>
                  )
                )}
              </ul>
            </div>
          );
        })
      )}
    </section>
  );
}
