import { ThemeSelect } from "@/components/theme/ThemeSelect";

export function DisplayPreferencesSection() {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-foreground">Préférences d&apos;affichage</h2>
        <p className="text-xs text-muted-foreground">
          S&apos;applique immédiatement et est mémorisé sur cet appareil.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-muted-foreground">Thème</label>
        <ThemeSelect surface="light" />
      </div>
    </section>
  );
}
