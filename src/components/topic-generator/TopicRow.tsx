"use client";

import { IconLock } from "@/components/icons";
import { DevelopMenu } from "@/components/shared/DevelopMenu";
import { CONTENT_TYPE_LABEL } from "@/lib/content-types";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type { Topic, TopicBatch } from "@/types/topic-batch";

interface TopicRowProps {
  topic: Topic;
  batch: TopicBatch;
  isDuplicate: boolean;
  /** true si une idée au libellé équivalent existe déjà dans le workspace — signalé, jamais
   * bloquant (voir detectExistingIdeaMatches). */
  isExistingInBank?: boolean;
  onToggleSelect: () => void;
  onToggleLock: () => void;
  onChangeLabel: (label: string) => void;
  onDelete: () => void;
}

export function TopicRow({
  topic,
  batch,
  isDuplicate,
  isExistingInBank,
  onToggleSelect,
  onToggleLock,
  onChangeLabel,
  onDelete,
}: TopicRowProps) {
  const t = useTranslations();
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-3 ${
        isDuplicate
          ? "border-amber-300 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10"
          : "border-border bg-surface  "
      }`}
    >
      <input
        type="checkbox"
        checked={topic.selected}
        onChange={onToggleSelect}
        aria-label={t("topicGenerator.topicRow.selectTopic")}
      />
      <div className="flex flex-1 flex-col">
        <input
          value={topic.label}
          onChange={(event) => onChangeLabel(event.target.value)}
          disabled={topic.locked}
          aria-label={t("topicGenerator.topicRow.editLabel")}
          className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm text-zinc-800 focus:border-zinc-200 focus:bg-white disabled:text-zinc-400 dark:text-zinc-200 dark:focus:border-white/[.08] dark:focus:bg-zinc-900 dark:disabled:text-zinc-600"
        />
        {topic.angle && (
          <span className="truncate px-2 text-xs text-muted-foreground">
            {t("topicGenerator.topicRow.anglePrefix", { angle: topic.angle })}
          </span>
        )}
      </div>
      {topic.contentType && (
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground ">
          {CONTENT_TYPE_LABEL[topic.contentType]}
        </span>
      )}
      {isDuplicate && (
        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
          {t("topicGenerator.topicRow.potentialDuplicate")}
        </span>
      )}
      {isExistingInBank && (
        <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-500/20 dark:text-sky-400">
          {t("topicGenerator.topicRow.alreadyInBank")}
        </span>
      )}
      <DevelopMenu variant="topic" topic={topic} batch={batch} />
      <button
        type="button"
        onClick={onToggleLock}
        aria-label={topic.locked ? t("topicGenerator.topicRow.unlockTopic") : t("topicGenerator.topicRow.lockTopic")}
        aria-pressed={topic.locked}
        className={`shrink-0 rounded-md p-1.5 ${
          topic.locked
            ? "text-zinc-900 dark:text-zinc-50"
            : "text-muted-foreground hover:text-zinc-600  dark:hover:text-zinc-400"
        }`}
      >
        <IconLock className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="shrink-0 text-xs font-medium text-red-500 hover:underline"
      >
        {t("common.delete")}
      </button>
    </div>
  );
}
