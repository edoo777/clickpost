import Image from "next/image";

interface MockupPlaceholderProps {
  /** Chemin sous `/public` (ex. `/marketing/hero.webp`) — dès qu'un fichier réel existe à cet
   * emplacement, passez-le ici pour remplacer automatiquement le placeholder, aucune autre
   * modification nécessaire. */
  src?: string;
  alt: string;
  /** Libellé affiché dans le placeholder tant qu'aucun `src` réel n'est fourni — décrit l'image
   * finale attendue (ex. "Capture d'écran — calendrier éditorial"). */
  label: string;
  /** Chemin suggéré à utiliser une fois l'asset réel prêt, affiché en petit dans le placeholder
   * pour que l'intégration future soit évidente sans avoir à relire le code. */
  suggestedPath: string;
  aspectClassName?: string;
  className?: string;
}

/**
 * Container d'image marketing — jamais une image de mauvaise qualité ou non pertinente insérée
 * par défaut (voir la consigne explicite du mandat) : tant qu'aucun `src` réel n'est fourni,
 * affiche un placeholder soigné (dégradé + bordure pointillée + libellé + chemin suggéré) plutôt
 * qu'une image générique. Dès qu'un fichier existe sous `/public/marketing/...`, passer `src`
 * fait apparaître la vraie image sans toucher au reste de la page.
 */
export function MockupPlaceholder({ src, alt, label, suggestedPath, aspectClassName = "aspect-[16/10]", className = "" }: MockupPlaceholderProps) {
  if (src) {
    return (
      <div className={`relative overflow-hidden rounded-2xl border border-border ${aspectClassName} ${className}`}>
        <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 720px" />
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed border-violet-300/60 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-6 text-center dark:border-violet-500/25 dark:from-violet-500/[.06] dark:to-fuchsia-500/[.06] ${aspectClassName} ${className}`}
      role="img"
      aria-label={alt}
    >
      <span className="rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-violet-700 dark:bg-black/20 dark:text-violet-300">
        Asset à venir
      </span>
      <p className="max-w-xs text-sm font-medium text-foreground/80">{label}</p>
      <code className="rounded-md bg-black/5 px-2 py-1 text-[11px] text-muted-foreground dark:bg-white/10">{suggestedPath}</code>
    </div>
  );
}
