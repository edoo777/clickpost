"use client";

import type { WorkspaceLoadError } from "@/lib/supabase/workspace-provider";

interface WorkspaceErrorNoticeProps {
  error: WorkspaceLoadError;
  onRetry: () => void;
}

/**
 * Affiché lorsque le workspace n'a pas pu être chargé — jamais confondu avec un rôle « membre »
 * réel : ce n'est pas une question de permission, mais d'échec de chargement. Le détail
 * technique (code/message) n'apparaît qu'en développement ; aucun identifiant ni secret en
 * production.
 */
export function WorkspaceErrorNotice({ error, onRetry }: WorkspaceErrorNoticeProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/20 dark:bg-red-500/10">
      <p className="text-sm font-medium text-red-700 dark:text-red-400">
        Impossible de charger votre workspace.
      </p>
      <p className="text-xs text-red-600/90 dark:text-red-400/80">
        Aucun rôle n&apos;a pu être déterminé — ceci n&apos;est pas un statut de lecture seule confirmé.
      </p>
      {process.env.NODE_ENV !== "production" && (
        <p className="rounded bg-red-100 px-2 py-1 font-mono text-[11px] text-red-800 dark:bg-red-500/20 dark:text-red-300">
          [{error.code}] {error.message}
        </p>
      )}
      <button
        type="button"
        onClick={onRetry}
        className="w-fit rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/20"
      >
        Réessayer
      </button>
    </div>
  );
}
