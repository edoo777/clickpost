import type { ReactNode } from "react";

interface IdeaWorkshopSectionProps {
  title: string;
  children: ReactNode;
}

export function IdeaWorkshopSection({ title, children }: IdeaWorkshopSectionProps) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-white/[.08] dark:bg-zinc-950">
      <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}
