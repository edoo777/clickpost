import { platformIcons } from "@/components/icons";
import { useAccountsSession } from "@/lib/accounts-store";
import { platformColors } from "@/lib/platform-colors";
import { PLATFORM_LABEL, STATUS_LABEL, STATUS_STYLE } from "@/lib/post-status";
import type { Publication } from "@/types/publication";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

interface PostDetailPanelProps {
  post: Publication;
  onClose: () => void;
}

export function PostDetailPanel({ post, onClose }: PostDetailPanelProps) {
  const { accounts } = useAccountsSession();
  const color = platformColors[post.platform];
  const Icon = platformIcons[post.platform];
  const account = accounts.find((candidate) => candidate.id === post.accountId);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Fermer le panneau"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
      />
      <div className="relative flex h-full w-full max-w-md flex-col gap-5 overflow-y-auto bg-surface p-6 shadow-xl ">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className={`flex h-9 w-9 items-center justify-center rounded-full ${color.bg}`}>
              <Icon className={`h-4 w-4 ${color.text}`} />
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground ">
                {PLATFORM_LABEL[post.platform]}
              </span>
              <span className="text-xs text-muted-foreground ">
                {account?.handle ?? post.brand}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted  "
          >
            ✕
          </button>
        </div>

        <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[post.status]}`}>
          {STATUS_LABEL[post.status]}
        </span>

        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-foreground ">{post.excerpt}</h2>
          <p className="text-sm text-muted-foreground ">
            {post.brand} · {dateFormatter.format(new Date(post.scheduledFor))}
          </p>
        </div>

        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{post.text}</p>

        <div className="mt-auto flex gap-3 border-t border-border pt-4 ">
          <button
            type="button"
            disabled
            className="flex-1 cursor-not-allowed rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground  "
          >
            Modifier
          </button>
          <button
            type="button"
            disabled
            className="flex-1 cursor-not-allowed rounded-lg bg-muted px-4 py-2 text-sm font-medium text-muted-foreground  "
          >
            Approuver
          </button>
        </div>
      </div>
    </div>
  );
}
