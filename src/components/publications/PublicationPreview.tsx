import { platformIcons } from "@/components/icons";
import { connectedAccounts } from "@/lib/demo-data";
import { FORMAT_LABEL } from "@/lib/editorial-constants";
import { platformColors } from "@/lib/platform-colors";
import type { Publication } from "@/types/publication";

const VERTICAL_FORMATS = new Set<Publication["format"]>(["short_video", "story"]);

interface PublicationPreviewProps {
  publication: Publication;
}

export function PublicationPreview({ publication }: PublicationPreviewProps) {
  const color = platformColors[publication.platform];
  const Icon = platformIcons[publication.platform];
  const account = connectedAccounts.find((candidate) => candidate.id === publication.accountId);
  const mediaAspect = VERTICAL_FORMATS.has(publication.format) ? "aspect-[9/16]" : "aspect-square";
  const hashtags = publication.hashtags.filter((tag) => tag.trim().length > 0);

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-black/[.08] bg-white p-5 dark:border-white/[.08] dark:bg-zinc-950">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Aperçu de la publication</h2>
        <span className="text-xs text-zinc-400 dark:text-zinc-600">{FORMAT_LABEL[publication.format]}</span>
      </div>

      <div className={`mx-auto flex w-full max-w-xs flex-col gap-3 rounded-2xl border p-4 ${color.border} ${color.bg}`}>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70 dark:bg-black/30">
            <Icon className={`h-4 w-4 ${color.text}`} />
          </span>
          <span className={`text-sm font-medium ${color.text}`}>
            {account?.handle ?? publication.brand}
          </span>
        </div>

        {publication.media.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {publication.media.slice(0, 4).map((media) => (
              <div
                key={media.id}
                className={`flex flex-col items-center justify-center gap-1 rounded-lg bg-white/60 px-2 text-center text-xs font-medium text-zinc-500 dark:bg-black/20 dark:text-zinc-400 ${mediaAspect}`}
              >
                <span>{media.type === "video" ? "Vidéo" : "Image"}</span>
                <span className="truncate text-[10px] text-zinc-400 dark:text-zinc-600">
                  {media.label || "sans nom"}
                </span>
              </div>
            ))}
          </div>
        )}

        <p className="whitespace-pre-line text-sm text-zinc-800 dark:text-zinc-100">
          {publication.text || "Aucun texte rédigé pour l'instant."}
        </p>

        {hashtags.length > 0 && (
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{hashtags.join(" ")}</p>
        )}

        {publication.cta && (
          <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold text-white ${color.dot}`}>
            {publication.cta}
          </span>
        )}
      </div>

      {publication.firstComment && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Premier commentaire : <span className="italic">{publication.firstComment}</span>
        </p>
      )}
    </section>
  );
}
