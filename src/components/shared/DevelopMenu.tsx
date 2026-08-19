"use client";

import { useEffect, useRef, useState } from "react";
import { IconWand } from "@/components/icons";
import { useDevelopIdea } from "@/lib/develop-idea";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type { Idea } from "@/types/idea";
import type { IdeaNote } from "@/types/idea-note";
import type { Topic, TopicBatch } from "@/types/topic-batch";

type DevelopMenuProps =
  | { variant: "topic"; topic: Topic; batch: TopicBatch; compact?: boolean }
  | { variant: "note"; note: IdeaNote; compact?: boolean }
  | { variant: "idea"; idea: Idea; compact?: boolean };

const ITEM_CLASS =
  "block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-violet-500/10 dark:hover:text-violet-300";

const VIDEO_SCRIPT_INSTRUCTION =
  "Transforme ce sujet en script vidéo court, prêt à tourner : accroche, développement, appel à l'action.";
const STRUCTURE_INSTRUCTION =
  "Structure ce contenu clairement : accroche, développement en plusieurs points, conclusion avec appel à l'action.";

type MenuPhase = "closed" | "open" | "customInstruction";

/**
 * Action « Développer » partagée par le Générateur de sujets et la Banque d'idées (notes). Toute
 * la logique de création/dé-duplication d'idée et de publication vit dans useDevelopIdea() — ce
 * composant ne fait qu'afficher le menu et appeler ce hook.
 */
export function DevelopMenu(props: DevelopMenuProps) {
  const t = useTranslations();
  const { compact } = props;
  const [phase, setPhase] = useState<MenuPhase>("closed");
  const [customInstruction, setCustomInstruction] = useState("");
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    developTopic,
    developNote,
    developIdea,
    registerTopicAsIdea,
    convertNoteToIdea,
    createPublicationAndOpen,
    createPublicationAndSchedule,
  } = useDevelopIdea();

  useEffect(() => {
    if (phase === "closed") return;
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setPhase("closed");
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setPhase("closed");
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [phase]);

  useEffect(() => {
    if (!confirmation) return;
    const timeout = setTimeout(() => setConfirmation(null), 2500);
    return () => clearTimeout(timeout);
  }, [confirmation]);

  const isRegistered =
    props.variant === "idea" ? true : props.variant === "topic" ? Boolean(props.topic.ideaId) : Boolean(props.note.convertedIdeaId);

  // Un sujet hérite les réseaux ciblés de son bloc dès sa création en idée (voir
  // ensureIdeaForTopic) — pas besoin de créer l'idée juste pour savoir si l'action est possible.
  const hasPlatform =
    props.variant === "topic" ? props.batch.platforms.length > 0 : props.variant === "note" ? Boolean(props.note.platform) : Boolean(props.idea.platform);

  function stop(event: React.MouseEvent) {
    event.stopPropagation();
  }

  function resolveIdea(): Idea {
    if (props.variant === "topic") return registerTopicAsIdea(props.topic, props.batch);
    if (props.variant === "note") return convertNoteToIdea(props.note);
    return props.idea;
  }

  function develop(mode: "manual" | "ai", instructions?: string) {
    if (props.variant === "topic") developTopic(props.topic, props.batch, mode, instructions);
    else if (props.variant === "note") developNote(props.note, mode, instructions);
    else developIdea(props.idea, mode, instructions);
  }

  function handleManual(event: React.MouseEvent) {
    stop(event);
    setPhase("closed");
    develop("manual");
  }

  function handleAI(event: React.MouseEvent) {
    stop(event);
    setPhase("closed");
    develop("ai");
  }

  function handleVideoScript(event: React.MouseEvent) {
    stop(event);
    setPhase("closed");
    develop("ai", VIDEO_SCRIPT_INSTRUCTION);
  }

  function handleStructure(event: React.MouseEvent) {
    stop(event);
    setPhase("closed");
    develop("ai", STRUCTURE_INSTRUCTION);
  }

  function handleOpenCustomInstruction(event: React.MouseEvent) {
    stop(event);
    setPhase("customInstruction");
  }

  function handleSubmitCustomInstruction(event: React.MouseEvent) {
    stop(event);
    const value = customInstruction.trim();
    if (!value) return;
    setPhase("closed");
    setCustomInstruction("");
    develop("ai", value);
  }

  function handleRegisterOnly(event: React.MouseEvent) {
    stop(event);
    setPhase("closed");
    if (props.variant !== "topic") return;
    registerTopicAsIdea(props.topic, props.batch);
    setConfirmation(t("developMenu.addedConfirmation"));
  }

  function handleCreatePublication(event: React.MouseEvent) {
    stop(event);
    setPhase("closed");
    if (!hasPlatform) return;
    createPublicationAndOpen(resolveIdea());
  }

  function handleSchedule(event: React.MouseEvent) {
    stop(event);
    setPhase("closed");
    if (!hasPlatform) return;
    createPublicationAndSchedule(resolveIdea());
  }

  const isOpen = phase !== "closed";

  return (
    <div ref={containerRef} className="relative inline-block shrink-0">
      <button
        type="button"
        onClick={(event) => {
          stop(event);
          setPhase((prev) => (prev === "closed" ? "open" : "closed"));
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

      {phase === "open" && (
        <div
          role="menu"
          aria-label={t("developMenu.trigger")}
          className="absolute right-0 top-full z-50 mt-1 w-64 rounded-xl border border-border bg-surface-elevated p-1.5 shadow-xl"
        >
          <button type="button" role="menuitem" onClick={handleAI} className={ITEM_CLASS}>
            {t("developMenu.developWithAi")}
          </button>
          <button type="button" role="menuitem" onClick={handleVideoScript} className={ITEM_CLASS}>
            {t("developMenu.createVideoScript")}
          </button>
          <button type="button" role="menuitem" onClick={handleStructure} className={ITEM_CLASS}>
            {t("developMenu.structureContent")}
          </button>
          <button type="button" role="menuitem" onClick={handleOpenCustomInstruction} className={ITEM_CLASS}>
            {t("developMenu.customInstruction")}
          </button>
          <button type="button" role="menuitem" onClick={handleManual} className={ITEM_CLASS}>
            {t("developMenu.writeManually")}
          </button>
          <div className="my-1 border-t border-border" />
          <button
            type="button"
            role="menuitem"
            onClick={handleCreatePublication}
            disabled={!hasPlatform}
            title={!hasPlatform ? t("ideaWorkshop.view.selectNetworkHint") : undefined}
            className={ITEM_CLASS}
          >
            {t("developMenu.createPublication")}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={handleSchedule}
            disabled={!hasPlatform}
            title={!hasPlatform ? t("ideaWorkshop.view.selectNetworkHint") : undefined}
            className={ITEM_CLASS}
          >
            {t("developMenu.schedule")}
          </button>
          {props.variant === "topic" && !isRegistered && (
            <button type="button" role="menuitem" onClick={handleRegisterOnly} className={ITEM_CLASS}>
              {t("developMenu.addToIdeasBank")}
            </button>
          )}
        </div>
      )}

      {phase === "customInstruction" && (
        <div onClick={stop} className="absolute right-0 top-full z-50 mt-1 w-72 rounded-xl border border-violet-300 bg-surface-elevated p-3 shadow-xl dark:border-violet-500/30">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-foreground">
            {t("developMenu.customInstructionLabel")}
            <textarea
              autoFocus
              rows={3}
              value={customInstruction}
              onChange={(event) => setCustomInstruction(event.target.value)}
              placeholder={t("developMenu.customInstructionPlaceholder")}
              className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200"
            />
          </label>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={handleSubmitCustomInstruction}
              disabled={!customInstruction.trim()}
              className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("developMenu.send")}
            </button>
            <button type="button" onClick={() => setPhase("closed")} className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground">
              {t("common.cancel")}
            </button>
          </div>
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
