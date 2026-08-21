"use client";

import { useState } from "react";
import { IconPlay } from "@/components/icons";

interface VideoPlayerProps {
  /** Chemin sous `/public` (ex. `/videos/clickpost-demo.mp4`) — dès qu'un fichier réel existe,
   * passez-le ici : le lecteur bascule automatiquement en lecture réelle au clic, aucune autre
   * modification nécessaire. */
  src?: string;
  posterLabel: string;
  playLabel: string;
  comingSoonLabel: string;
}

/**
 * Lecteur vidéo produit 16:9 — emplacement et interaction prêts pour
 * `/public/videos/clickpost-demo.mp4` (voir le mandat, section Vidéos et Images). Tant qu'aucune
 * vidéo réelle n'existe, le clic sur ▶ affiche un message honnête ("Vidéo bientôt disponible")
 * plutôt qu'un lecteur cassé ou une vidéo de remplacement non pertinente.
 */
export function VideoPlayer({ src, posterLabel, playLabel, comingSoonLabel }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (src && isPlaying) {
    return (
      <div className="accent-halo aspect-video overflow-hidden rounded-2xl border border-border bg-black">
        <video src={src} controls autoPlay className="h-full w-full" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => (src ? setIsPlaying(true) : undefined)}
      aria-label={playLabel}
      className="group accent-halo relative flex aspect-video w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-violet-300/60 bg-gradient-to-br from-[#150f2b] via-[#1c1333] to-[#2a0f2f] text-center dark:border-violet-500/30"
    >
      <div className="absolute inset-0 opacity-40 [background:radial-gradient(600px_300px_at_50%_30%,rgba(192,38,211,0.35),transparent_60%)]" />
      <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/95 shadow-xl transition-transform group-hover:scale-110">
        <IconPlay className="ml-1 h-6 w-6 text-violet-700" />
      </span>
      <span className="relative text-sm font-semibold text-white">{playLabel}</span>
      <span className="relative rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-white/70">
        {src ? posterLabel : comingSoonLabel}
      </span>
    </button>
  );
}
