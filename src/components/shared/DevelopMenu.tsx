"use client";

import { useEffect, useRef, useState } from "react";
import { IconWand } from "@/components/icons";
import { useDevelopIdea } from "@/lib/develop-idea";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type { Idea } from "@/types/idea";
import type { Topic, TopicBatch } from "@/types/topic-batch";

type DevelopMenuProps =
  | { variant: "topic"; topic: Topic; batch: TopicBatch; compact?: boolean }
  | { variant: "idea"; idea: Idea; compact?: boolean };

const ITEM_CLASS =
  "block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-500/10 dark:hover:text-violet-300";

/**
 * Action « Développer » partagée par le Générateur de sujets et les trois modes de la Banque
 * d'idées. Toute la logique de création/dé-duplication d'idée vit dans useDevelopIdea() — ce
 * composant ne fait qu'afficher le menu et appeler ce hook.
 */
export function DevelopMenu(props: DevelopMenuProps) {
  const t = useTranslations();
  const { compact } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { developTopic, developIdea, registerTopicAsIdea } = useDevelopIdea();

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

  useEffect(() => {
    if (!confirmation) return;
    const timeout = setTimeout(() => setConfirmation(null), 2500);
    return () => clearTimeout(timeout);
  }, [confirmation]);

  const isRegistered = props.variant === "idea" || Boolean(props.topic.ideaId);

  function stop(event: React.MouseEvent) {
    event.stopPropagation();
  }

  function handleManual(event: React.MouseEvent) {
    stop(event);
    setIsOpen(false);
    if (props.variant === "topic") developTopic(props.topic, props.batch, "manual");
    else developIdea(props.idea, "manual");
  }

  function handleAI(event: React.MouseEvent) {
    stop(event);
    setIsOpen(false);
    if (props.variant === "topic") developTopic(props.topic, props.batch, "ai");
    else developIdea(props.idea, "ai");
  }

  function handleRegisterOnly(event: React.MouseEvent) {
    stop(event);
    setIsOpen(false);
    if (props.variant !== "topic") return;
    registerTopicAsIdea(props.topic, props.batch);
    setConfirmation(t("developMenu.addedConfirmation"));
  }

  return (
    <div ref={containerRef} className="relative inline-block shrink-0">
      <button
        type="button"
        onClick={(event) => {
          stop(event);
          setIsOpen((prev) => !prev);
        }}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg font-medium transition-colors ${
          compact
            ? "p-1.5 text-muted-foreground hover:bg-muted hover:text-violet-700 dark:hover:text-violet-300"
            : "border border-border px-2.5 py-1.5 text-xs text-zinc-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
        }`}
      >
        <IconWand className="h-3.5 w-3.5" />
        {!compact && <span>{t("developMenu.trigger")}</span>}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label={t("developMenu.trigger")}
          className="absolute right-0 top-full z-50 mt-1 w-60 rounded-xl border border-border bg-surface-elevated p-1.5 shadow-xl"
        >
          <button type="button" role="menuitem" onClick={handleManual} className={ITEM_CLASS}>
            {t("developMenu.writeManually")}
          </button>
          <button type="button" role="menuitem" onClick={handleAI} className={ITEM_CLASS}>
            {t("developMenu.developWithAi")}
          </button>
          {!isRegistered && (
            <button type="button" role="menuitem" onClick={handleRegisterOnly} className={ITEM_CLASS}>
              {t("developMenu.addToIdeasBank")}
            </button>
          )}
        </div>
      )}

      {confirmation && (
        <span
          role="status"
          className="absolute right-0 top-full z-50 mt-1 w-max rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg"
        >
          {confirmation}
        </span>
      )}
    </div>
  );
}
