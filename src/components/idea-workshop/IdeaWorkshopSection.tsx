import type { ReactNode } from "react";

interface IdeaWorkshopSectionProps {
  title: string;
  children: ReactNode;
}

export function IdeaWorkshopSection({ title, children }: IdeaWorkshopSectionProps) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5  ">
      <h2 className="text-sm font-semibold text-foreground ">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}
