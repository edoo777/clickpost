export function ObjectivesSection({ goals }: { goals: string[] }) {
  if (goals.length === 0) return null;

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold text-foreground">Objectifs</h2>
      <p className="text-xs text-muted-foreground">
        Objectifs qualitatifs déclarés pour cette marque — aucune cible chiffrée n&apos;étant
        configurable dans ClickPost aujourd&apos;hui, aucun écart cible/réalisé n&apos;est calculé ici.
      </p>
      <ul className="flex flex-wrap gap-2">
        {goals.map((goal) => (
          <li key={goal} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
            {goal}
          </li>
        ))}
      </ul>
    </section>
  );
}
