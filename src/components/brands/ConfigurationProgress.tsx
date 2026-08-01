import type { ConfigurationStep } from "@/lib/brand-configuration-progress";

interface ConfigurationProgressProps {
  steps: ConfigurationStep[];
}

export function ConfigurationProgress({ steps }: ConfigurationProgressProps) {
  return (
    <ul className="flex flex-wrap gap-2">
      {steps.map((step) => (
        <li
          key={step.key}
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
            step.done
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
              : "border-border text-muted-foreground "
          }`}
        >
          <span aria-hidden="true">{step.done ? "✓" : "○"}</span>
          {step.label}
        </li>
      ))}
    </ul>
  );
}
