import Image from "next/image";
import type { ComponentType, SVGProps } from "react";
import { IconCamera, IconDeviceMobile, IconMicrophone, IconPersonSilhouette, IconTiktok } from "@/components/icons";

export type HumanPersona =
  | "creatorCamera"
  | "podcaster"
  | "youtubeCreator"
  | "entrepreneurContent"
  | "marketingTeam"
  | "socialMediaManager"
  | "consultant"
  | "tiktokCreator"
  | "creatorPhone";

const PERSONA_ICON: Record<HumanPersona, ComponentType<SVGProps<SVGSVGElement>>> = {
  creatorCamera: IconCamera,
  podcaster: IconMicrophone,
  youtubeCreator: IconCamera,
  entrepreneurContent: IconDeviceMobile,
  marketingTeam: IconPersonSilhouette,
  socialMediaManager: IconDeviceMobile,
  consultant: IconPersonSilhouette,
  tiktokCreator: IconTiktok,
  creatorPhone: IconDeviceMobile,
};

const PERSONA_TONE: Record<HumanPersona, string> = {
  creatorCamera: "from-violet-600 to-fuchsia-600",
  podcaster: "from-fuchsia-600 to-rose-500",
  youtubeCreator: "from-red-500 to-fuchsia-600",
  entrepreneurContent: "from-blue-600 to-violet-600",
  marketingTeam: "from-violet-600 to-blue-600",
  socialMediaManager: "from-fuchsia-600 to-violet-600",
  consultant: "from-indigo-600 to-fuchsia-600",
  tiktokCreator: "from-fuchsia-600 to-indigo-600",
  creatorPhone: "from-blue-600 to-fuchsia-600",
};

interface HumanPlaceholderProps {
  persona: HumanPersona;
  /** Chemin sous `/public` (ex. `/marketing/creator-camera.webp`) — dès qu'une vraie photo existe,
   * passez-le ici pour la faire apparaître automatiquement, aucune autre modification requise. */
  src?: string;
  alt: string;
  /** Légende affichée en surimpression (ex. "Créatrice de contenu"). */
  label: string;
  suggestedPath: string;
  aspectClassName?: string;
  className?: string;
}

/**
 * Emplacement de présence humaine — jamais une case grise "asset à venir" : tant qu'aucune vraie
 * photo n'existe, affiche une composition duotone à l'identité ClickPost (dégradé violet/fuchsia,
 * silhouette, légende) qui a l'air volontaire plutôt qu'inachevé. Voir le mandat de direction
 * artistique : "si les bonnes images ne sont pas disponibles, construire des placeholders
 * visuellement propres et documenter précisément ce qu'il faut remplacer" — `suggestedPath`
 * indique exactement où déposer la vraie photo pour qu'elle remplace ce composant sans aucun
 * autre changement de code.
 */
export function HumanPlaceholder({ persona, src, alt, label, suggestedPath, aspectClassName = "aspect-[4/5]", className = "" }: HumanPlaceholderProps) {
  const Icon = PERSONA_ICON[persona];
  const tone = PERSONA_TONE[persona];

  if (src) {
    return (
      <div className={`relative overflow-hidden rounded-2xl border border-border ${aspectClassName} ${className}`}>
        <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 480px" />
        <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3 text-sm font-semibold text-white">
          {label}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col items-center justify-end overflow-hidden rounded-2xl bg-gradient-to-br ${tone} ${aspectClassName} ${className}`}
      role="img"
      aria-label={alt}
    >
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:16px_16px]" />
      <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <Icon className="relative mb-auto mt-10 h-12 w-12 text-white/85" />
      <div className="relative flex w-full flex-col gap-1 bg-black/20 px-4 py-3 backdrop-blur-sm">
        <span className="text-sm font-semibold text-white">{label}</span>
        <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-white/70">
          <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
          Photo à intégrer · {suggestedPath}
        </span>
      </div>
    </div>
  );
}
