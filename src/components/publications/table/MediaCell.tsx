"use client";

import { useEffect, useRef, useState } from "react";
import { MediaUploader } from "@/components/publications/MediaUploader";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type { PublicationMedia } from "@/types/publication";

interface MediaCellProps {
  workspaceId?: string;
  brandId?: string;
  publicationId: string;
  media: PublicationMedia[];
  editable: boolean;
  onChange: (media: PublicationMedia[]) => void;
}

/**
 * Cellule Média compacte du tableau — jamais une grosse image directement dans la ligne (voir
 * la consigne explicite), seulement une petite miniature. Le clic ouvre un panneau flottant qui
 * réutilise MediaUploader tel quel (ajout/remplacement/suppression réels, jamais réimplémentés
 * ici) ; un second clic sur la miniature à l'intérieur du panneau ouvre un aperçu plein cadre.
 */
export function MediaCell({ workspaceId, brandId, publicationId, media, editable, onChange }: MediaCellProps) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const first = media[0];

  useEffect(() => {
    if (!isOpen) return;
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative flex justify-center">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={first ? t("publications.table.mediaManage") : t("publications.table.mediaAdd")}
        className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted text-muted-foreground hover:border-violet-300 hover:text-violet-700 dark:hover:border-violet-500/40 dark:hover:text-violet-300"
      >
        {first?.url ? (
          first.type === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element -- miniature d'un média Storage, jamais dans /public.
            <img src={first.url} alt="" className="h-full w-full object-cover" />
          ) : (
            <video src={first.url} className="h-full w-full object-cover" muted />
          )
        ) : (
          <span className="text-base leading-none">+</span>
        )}
      </button>
      {media.length > 1 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[9px] font-semibold text-white">
          {media.length}
        </span>
      )}

      {isOpen && (
        <div
          onClick={(event) => event.stopPropagation()}
          className="absolute right-0 top-full z-50 mt-1 w-80 rounded-xl border border-border bg-surface-elevated p-3 shadow-xl"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">{t("publications.table.mediaPanelTitle")}</span>
            {first?.url && (
              <button
                type="button"
                onClick={() => setPreviewUrl(first.url ?? null)}
                className="text-xs font-medium text-violet-600 hover:underline dark:text-violet-400"
              >
                {t("publications.table.mediaPreview")}
              </button>
            )}
          </div>
          <MediaUploader
            workspaceId={workspaceId}
            brandId={brandId}
            publicationId={publicationId}
            value={media}
            editable={editable}
            onChange={onChange}
          />
        </div>
      )}

      {previewUrl && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewUrl(null)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-8"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- aperçu plein cadre d'un média Storage. */}
          <img src={previewUrl} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
        </div>
      )}
    </div>
  );
}
