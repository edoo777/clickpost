"use client";

import { useEffect, useState } from "react";
import { IconClose, IconPlay } from "@/components/icons";

interface VideoPlayerProps {
  /** Chemin sous `/public` — par défaut `/videos/clickpost-demo.mp4`. Le composant vérifie
   * lui-même si le fichier existe réellement (requête HEAD) : dès que vous déposez le fichier à
   * cet emplacement, la lecture réelle s'active automatiquement, aucune modification de code
   * nécessaire. */
  src?: string;
  posterLabel: string;
  playLabel: string;
  comingSoonLabel: string;
}

/**
 * Lecteur vidéo produit 16:9 — emplacement prêt pour `/public/videos/clickpost-demo.mp4` (voir le
 * mandat). Tant que le fichier n'existe pas, affiche une composition ClickPost soignée (dégradé de
 * marque, calque d'interface stylisé, bouton ▶) plutôt qu'un texte "Asset à venir" — jamais un
 * lecteur cassé. Une fois le fichier déposé, un clic ouvre une lightbox plein écran avec la vraie
 * vidéo (16:9, contrôles natifs, fermeture au clic extérieur ou à Échap).
 */
export function VideoPlayer({ src = "/videos/clickpost-demo.mp4", posterLabel, playLabel, comingSoonLabel }: VideoPlayerProps) {
  const [videoExists, setVideoExists] = useState<boolean | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(src, { method: "HEAD" })
      .then((response) => {
        if (!cancelled) setVideoExists(response.ok);
      })
      .catch(() => {
        if (!cancelled) setVideoExists(false);
      });
    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    if (!isLightboxOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsLightboxOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => videoExists && setIsLightboxOpen(true)}
        aria-label={playLabel}
        className="group accent-halo relative flex aspect-video w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-violet-300/60 bg-gradient-to-br from-[#150f2b] via-[#1c1333] to-[#2a0f2f] text-center dark:border-violet-500/30"
      >
        <div className="absolute inset-0 opacity-40 [background:radial-gradient(600px_300px_at_50%_30%,rgba(192,38,211,0.35),transparent_60%)]" />
        {/* Calque d'interface stylisé — laisse deviner un calendrier derrière le bouton play,
            jamais un fond totalement vide. */}
        <div className="pointer-events-none absolute inset-x-10 bottom-6 top-10 hidden overflow-hidden rounded-xl border border-white/10 bg-white/[.04] opacity-70 sm:block">
          <div className="flex h-8 items-center gap-1.5 border-b border-white/10 bg-white/[.03] px-3">
            <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
          </div>
          <div className="grid grid-cols-4 gap-2 p-3">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="h-3 rounded bg-gradient-to-r from-violet-500/30 to-fuchsia-500/30" style={{ width: `${60 + (i % 3) * 15}%` }} />
            ))}
          </div>
        </div>

        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/95 shadow-xl transition-transform group-hover:scale-110">
          <IconPlay className="ml-1 h-6 w-6 text-violet-700" />
        </span>
        <span className="relative text-sm font-semibold text-white">{playLabel}</span>
        <span className="relative rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-white/70">
          {videoExists ? posterLabel : comingSoonLabel}
        </span>
      </button>

      {isLightboxOpen && videoExists && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-8">
          <button
            type="button"
            aria-label={playLabel}
            onClick={() => setIsLightboxOpen(false)}
            className="absolute inset-0 cursor-default"
          />
          <div className="relative w-full max-w-4xl">
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              aria-label="Fermer"
              className="absolute -top-11 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <IconClose className="h-5 w-5" />
            </button>
            <div className="aspect-video overflow-hidden rounded-2xl bg-black shadow-2xl">
              <video src={src} controls autoPlay className="h-full w-full" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
