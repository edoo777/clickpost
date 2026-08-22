import { HumanPlaceholder, type HumanPersona } from "@/components/marketing/HumanPlaceholder";

interface PersonaShowcaseProps {
  persona: HumanPersona;
  eyebrow: string;
  title: string;
  description: string;
  badges: string[];
  reverse?: boolean;
  className?: string;
}

/**
 * Composition "humain + ClickPost" — associe une présence humaine (HumanPlaceholder) à un
 * mini-résumé de ce que ClickPost fait pour ce profil, sous forme de badges concrets (ex. "12
 * clips planifiés"). Reprend les exemples conceptuels du mandat de direction artistique
 * (podcasteur + calendrier, créateur + banque de sujets + script, agence + plusieurs marques).
 */
export function PersonaShowcase({ persona, eyebrow, title, description, badges, reverse = false, className = "" }: PersonaShowcaseProps) {
  return (
    <div
      className={`grid grid-cols-1 items-center gap-6 rounded-2xl border border-border bg-surface p-6 sm:grid-cols-[220px_1fr] sm:p-7 ${
        reverse ? "sm:[&>*:first-child]:order-2" : ""
      } ${className}`}
    >
      <HumanPlaceholder
        persona={persona}
        alt={title}
        label={title}
        suggestedPath={`/marketing/${persona}.webp`}
        aspectClassName="aspect-[4/3] sm:aspect-[4/5]"
      />
      <div className="flex flex-col gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">{eyebrow}</span>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <span key={badge} className="rounded-full border border-border bg-muted/60 px-3 py-1.5 text-xs font-medium text-foreground/85">
              {badge}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
