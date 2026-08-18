"use client";

import { useRef, useState } from "react";
import { useTranslations } from "@/lib/i18n/locale-provider";
import {
  buildPublicationMediaPath,
  deletePublicationMediaFile,
  getPublicationMediaSignedUrl,
  uploadPublicationMediaWithProgress,
} from "@/lib/supabase/publication-media-storage";
import { formatBytes, MAX_MEDIA_COUNT, sanitizeFileName, validateMediaFile } from "@/lib/publication-media";
import type { PublicationMedia } from "@/types/publication";

const ACCEPTED_MIME = "image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm";

interface UploadingEntry {
  mediaId: string;
  fileName: string;
  sizeBytes: number;
  progress: number;
  error: string | null;
  localPreviewUrl: string;
  file: File;
  kind: "image" | "video";
  path: string;
}

interface MediaUploaderProps {
  workspaceId?: string;
  brandId?: string;
  publicationId: string;
  value: PublicationMedia[];
  editable: boolean;
  onChange: (value: PublicationMedia[]) => void;
}

/**
 * Téléversement réel de médias — remplace l'ancien placeholder. Chaque fichier est validé côté
 * client (voir lib/publication-media.ts) puis téléversé immédiatement vers Supabase Storage, à un
 * chemin déjà stable (l'id de la publication est généré dès l'ouverture du formulaire, voir
 * PublicationView.tsx) : jamais de dossier temporaire séparé à finaliser plus tard. La sécurité
 * réelle vient des politiques RLS du bucket, pas de ce composant.
 */
export function MediaUploader({ workspaceId, brandId, publicationId, value, editable, onChange }: MediaUploaderProps) {
  const t = useTranslations();
  const [uploading, setUploading] = useState<UploadingEntry[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);

  const totalCount = value.length + uploading.length;

  async function startUpload(file: File) {
    if (!workspaceId) {
      setGlobalError(t("publications.mediaUploader.noWorkspace"));
      return;
    }
    const validation = validateMediaFile(file, totalCount);
    if (!validation.valid) {
      setGlobalError(validation.message);
      return;
    }
    setGlobalError(null);

    const mediaId = crypto.randomUUID();
    const safeName = sanitizeFileName(file.name);
    const extension = safeName.split(".").pop()?.toLowerCase() ?? (validation.kind === "image" ? "jpg" : "mp4");
    const path = buildPublicationMediaPath(workspaceId, brandId, publicationId, mediaId, extension);
    const localPreviewUrl = URL.createObjectURL(file);

    const entry: UploadingEntry = {
      mediaId,
      fileName: safeName,
      sizeBytes: file.size,
      progress: 0,
      error: null,
      localPreviewUrl,
      file,
      kind: validation.kind,
      path,
    };
    setUploading((prev) => [...prev, entry]);

    const result = await uploadPublicationMediaWithProgress(path, file, (percent) => {
      setUploading((prev) => prev.map((item) => (item.mediaId === mediaId ? { ...item, progress: percent } : item)));
    });

    if (result.error) {
      setUploading((prev) => prev.map((item) => (item.mediaId === mediaId ? { ...item, error: result.error } : item)));
      return;
    }

    setUploading((prev) => prev.filter((item) => item.mediaId !== mediaId));
    onChange([
      ...value,
      {
        id: mediaId,
        type: validation.kind,
        label: safeName,
        storagePath: path,
        mimeType: file.type,
        sizeBytes: file.size,
        url: localPreviewUrl, // aperçu immédiat ; remplacé par une URL signée à l'affichage ultérieur si besoin.
        order: value.length,
      },
    ]);
  }

  function handleFileList(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = MAX_MEDIA_COUNT - totalCount;
    if (remaining <= 0) {
      setGlobalError(t("publications.mediaUploader.maxMedia", { max: MAX_MEDIA_COUNT }));
      return;
    }
    Array.from(files)
      .slice(0, remaining)
      .forEach((file) => void startUpload(file));
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingOver(false);
    if (!editable) return;
    handleFileList(event.dataTransfer.files);
  }

  async function retryUpload(entry: UploadingEntry) {
    setUploading((prev) => prev.filter((item) => item.mediaId !== entry.mediaId));
    await startUpload(entry.file);
  }

  function cancelUploading(mediaId: string) {
    setUploading((prev) => prev.filter((item) => item.mediaId !== mediaId));
  }

  async function removeMedia(media: PublicationMedia) {
    if (!window.confirm(t("publications.mediaUploader.confirmDelete", { label: media.label || media.id }))) return;
    if (media.storagePath) {
      await deletePublicationMediaFile(media.storagePath);
    }
    onChange(value.filter((item) => item.id !== media.id));
  }

  function beginReplace(mediaId: string) {
    setReplacingId(mediaId);
    replaceInputRef.current?.click();
  }

  async function handleReplaceFile(files: FileList | null) {
    const file = files?.[0];
    const targetId = replacingId;
    setReplacingId(null);
    if (!file || !targetId || !workspaceId) return;
    const target = value.find((item) => item.id === targetId);
    if (!target) return;

    const validation = validateMediaFile(file, totalCount - 1);
    if (!validation.valid) {
      setGlobalError(validation.message);
      return;
    }
    if (!window.confirm(t("publications.mediaUploader.confirmReplace", { oldLabel: target.label || target.id, newLabel: file.name }))) return;

    if (target.storagePath) await deletePublicationMediaFile(target.storagePath);

    const safeName = sanitizeFileName(file.name);
    const extension = safeName.split(".").pop()?.toLowerCase() ?? (validation.kind === "image" ? "jpg" : "mp4");
    const path = buildPublicationMediaPath(workspaceId, brandId, publicationId, targetId, extension);
    const localPreviewUrl = URL.createObjectURL(file);

    setGlobalError(null);
    const result = await uploadPublicationMediaWithProgress(path, file, () => {});
    if (result.error) {
      setGlobalError(result.error);
      return;
    }
    onChange(
      value.map((item) =>
        item.id === targetId
          ? { ...item, label: safeName, storagePath: path, mimeType: file.type, sizeBytes: file.size, url: localPreviewUrl, type: validation.kind }
          : item
      )
    );
  }

  function moveMedia(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((item, i) => ({ ...item, order: i })));
  }

  async function refreshSignedUrl(media: PublicationMedia) {
    if (!media.storagePath) return;
    const signed = await getPublicationMediaSignedUrl(media.storagePath);
    if (signed) onChange(value.map((item) => (item.id === media.id ? { ...item, url: signed } : item)));
  }

  return (
    <div className="col-span-1 flex flex-col gap-3 md:col-span-2">
      {editable && (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${
            isDraggingOver ? "border-violet-400 bg-violet-50 dark:bg-violet-500/10" : "border-zinc-300 dark:border-white/[.16]"
          }`}
        >
          <p className="text-sm text-muted-foreground">{t("publications.mediaUploader.dragDrop")}</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
          >
            {t("publications.mediaUploader.chooseFile")}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_MIME}
            multiple
            className="hidden"
            onChange={(event) => {
              handleFileList(event.target.files);
              event.target.value = "";
            }}
          />
          <p className="text-[11px] text-muted-foreground">
            {t("publications.mediaUploader.formatsHint", { count: MAX_MEDIA_COUNT })}
          </p>
        </div>
      )}
      <input
        ref={replaceInputRef}
        type="file"
        accept={ACCEPTED_MIME}
        className="hidden"
        onChange={(event) => {
          void handleReplaceFile(event.target.files);
          event.target.value = "";
        }}
      />

      {globalError && <p className="text-xs text-red-600 dark:text-red-400">{globalError}</p>}

      {uploading.map((entry) => (
        <div key={entry.mediaId} className="flex items-center gap-3 rounded-lg border border-border p-2">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
            {entry.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element -- aperçu local (objet blob), pas dans /public.
              <img src={entry.localPreviewUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <video src={entry.localPreviewUrl} className="h-full w-full object-cover" muted />
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="truncate text-xs font-medium text-foreground">{entry.fileName}</p>
            <p className="text-[11px] text-muted-foreground">{formatBytes(entry.sizeBytes)}</p>
            {entry.error ? (
              <p className="text-[11px] text-red-600 dark:text-red-400">{entry.error}</p>
            ) : (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 transition-all" style={{ width: `${entry.progress}%` }} />
              </div>
            )}
          </div>
          {entry.error ? (
            <button type="button" onClick={() => void retryUpload(entry)} className="shrink-0 text-xs font-medium text-violet-700 hover:underline dark:text-violet-300">
              {t("common.retry")}
            </button>
          ) : (
            <button type="button" onClick={() => cancelUploading(entry.mediaId)} className="shrink-0 text-xs font-medium text-muted-foreground hover:underline">
              {t("common.cancel")}
            </button>
          )}
        </div>
      ))}

      {value.map((media, index) => (
        <div key={media.id} className="flex items-center gap-3 rounded-lg border border-border p-2">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
            {media.url ? (
              media.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element -- média externe (Storage), pas dans /public.
                <img src={media.url} alt="" className="h-full w-full object-cover" onError={() => void refreshSignedUrl(media)} />
              ) : (
                <video src={media.url} className="h-full w-full object-cover" muted />
              )
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">{t("publications.mediaUploader.preview")}</div>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="truncate text-xs font-medium text-foreground">{media.label || media.id}</p>
            <p className="text-[11px] text-muted-foreground">
              {media.type === "image" ? t("publications.preview.image") : t("publications.preview.video")}
              {media.mimeType ? ` · ${media.mimeType}` : ""}
              {typeof media.sizeBytes === "number" ? ` · ${formatBytes(media.sizeBytes)}` : ""}
            </p>
          </div>
          {editable && (
            <div className="flex shrink-0 items-center gap-1.5">
              {value.length > 1 && (
                <>
                  <button type="button" disabled={index === 0} onClick={() => moveMedia(index, -1)} className="text-xs text-muted-foreground hover:underline disabled:opacity-30">
                    ↑
                  </button>
                  <button type="button" disabled={index === value.length - 1} onClick={() => moveMedia(index, 1)} className="text-xs text-muted-foreground hover:underline disabled:opacity-30">
                    ↓
                  </button>
                </>
              )}
              <button type="button" onClick={() => beginReplace(media.id)} className="text-xs font-medium text-violet-700 hover:underline dark:text-violet-300">
                {t("publications.mediaUploader.replace")}
              </button>
              <button type="button" onClick={() => void removeMedia(media)} className="text-xs font-medium text-red-500 hover:underline">
                {t("common.delete")}
              </button>
            </div>
          )}
        </div>
      ))}

      {value.length === 0 && uploading.length === 0 && !editable && <p className="text-sm text-muted-foreground">{t("publications.mediaUploader.noMedia")}</p>}
    </div>
  );
}
