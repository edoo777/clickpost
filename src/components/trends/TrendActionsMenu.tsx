"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DisplayableTrend } from "@/components/trends/displayable-trend";
import { useContentWorkspace } from "@/lib/content-workspace-store";
import { useDevelopIdea } from "@/lib/develop-idea";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { useIdeaNotesSession } from "@/lib/idea-notes-store";
import { plainTextToDocument } from "@/lib/rich-document";
import { useSavedTrendsSession } from "@/lib/saved-trends-store";
import { useWorkspaceSession } from "@/lib/supabase/workspace-provider";
import { reportIncorrectInformation } from "@/lib/trends/client";
import type { Idea } from "@/types/idea";

export interface TrendActionContext {
  brandId?: string;
  themeId?: string;
}

/**
 * Les 9 actions d'une tendance/actualité — réutilise entièrement le Générateur, la vue Notes,
 * l'Atelier et le calendrier existants (jamais de second moteur). Enregistrer/Masquer/Non
 * pertinente sont les seules actions qui écrivent en base (SavedTrend) ; les autres créent au
 * plus une Idée ou une Note via les magasins déjà existants, avec confirmation explicite.
 */
export function TrendActionsMenu({ trend, context }: { trend: DisplayableTrend; context: TrendActionContext }) {
  const t = useTranslations();
  const router = useRouter();
  const { userId } = useWorkspaceSession();
  const { saveTrend } = useSavedTrendsSession();
  const { addNote } = useIdeaNotesSession();
  const { addIdea } = useContentWorkspace();
  const { developIdea } = useDevelopIdea();
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  function close() {
    setIsOpen(false);
  }

  function notify(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 4000);
  }

  function handleSave(status: "saved" | "hidden" | "not_relevant", confirmLabel: string) {
    if (!userId) {
      notify(t("trends.actionsMenu.sessionLoadingNotice"));
      return close();
    }
    if (!window.confirm(confirmLabel)) return close();
    saveTrend(
      { brandId: context.brandId, provider: trend.provider, externalId: trend.externalId, title: trend.title, sourceUrl: trend.url, status },
      userId
    );
    notify(
      status === "saved"
        ? t("trends.actionsMenu.savedNotice")
        : status === "hidden"
          ? t("trends.actionsMenu.hiddenNotice")
          : t("trends.actionsMenu.notRelevantNotice")
    );
    close();
  }

  function buildIdeaFromTrend(): Idea {
    const now = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      brandId: context.brandId ?? "",
      themeId: context.themeId,
      title: trend.title,
      description: trend.description,
      source: "manual",
      status: "idea",
      platform: trend.platform,
      documentContent: trend.description ? plainTextToDocument(trend.description) : undefined,
      body: trend.description,
      workshopDisplayMode: "document",
      createdAt: now,
      updatedAt: now,
    };
  }

  function handleGenerateIdeas() {
    close();
    router.push("/boite-idees?tab=generateur");
  }

  function handleCreateNote() {
    if (!userId) {
      notify(t("trends.actionsMenu.sessionLoadingNotice"));
      return close();
    }
    if (!window.confirm(t("trends.actionsMenu.confirmCreateNote", { title: trend.title }))) return close();
    const now = new Date().toISOString();
    const note = {
      id: crypto.randomUUID(),
      brandId: context.brandId,
      themeId: context.themeId,
      title: trend.title,
      content: trend.description ? plainTextToDocument(trend.description) : plainTextToDocument(""),
      bodyText: trend.description ?? "",
      archiveStatus: "active" as const,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    };
    addNote(note);
    notify(t("trends.actionsMenu.noteCreatedNotice"));
    close();
  }

  function handleCreatePublication() {
    if (!window.confirm(t("trends.actionsMenu.confirmCreatePublication", { title: trend.title }))) return close();
    const idea = buildIdeaFromTrend();
    addIdea(idea);
    close();
    developIdea(idea, "manual");
  }

  function handleAddToCalendar() {
    // Le calendrier (/calendrier) n'affiche que des publications déjà programmées, jamais des
    // idées — une idée doit d'abord passer par l'Atelier pour qu'on lui assigne un format complet
    // et une date. Rediriger directement vers /calendrier ici créait l'idée sans jamais l'y faire
    // apparaître. Même parcours que « Créer une publication » ci-dessus.
    if (!window.confirm(t("trends.actionsMenu.confirmAddToCalendar", { title: trend.title }))) return close();
    const idea = buildIdeaFromTrend();
    addIdea(idea);
    close();
    developIdea(idea, "manual");
  }

  async function handleReport() {
    const reason = window.prompt(t("trends.actionsMenu.reportPrompt", { title: trend.title }));
    if (reason === null) return close(); // annulé
    const outcome = await reportIncorrectInformation({ itemId: trend.id, sourceUrl: trend.url, reason: reason || undefined });
    notify(outcome.status === "ok" ? t("trends.actionsMenu.reportSentNotice") : t("trends.actionsMenu.reportFailedNotice"));
    close();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
      >
        {t("trends.actionsMenu.actionsButton")}
      </button>

      {feedback && <p className="absolute -bottom-6 left-0 whitespace-nowrap text-[11px] text-emerald-600 dark:text-emerald-400">{feedback}</p>}

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={close} aria-hidden="true" />
          <div role="menu" className="absolute right-0 z-20 mt-1 w-64 rounded-xl border border-border bg-surface-elevated p-1.5 shadow-lg">
            <MenuButton onClick={() => handleSave("saved", t("trends.actionsMenu.confirmSave", { title: trend.title }))}>
              {t("common.save")}
            </MenuButton>
            <MenuButton onClick={() => handleSave("hidden", t("trends.actionsMenu.confirmHide", { title: trend.title }))}>
              {t("trends.actionsMenu.hide")}
            </MenuButton>
            <MenuButton onClick={() => handleSave("not_relevant", t("trends.actionsMenu.confirmNotRelevant", { title: trend.title }))}>
              {t("trends.actionsMenu.notRelevant")}
            </MenuButton>
            <MenuButton onClick={handleReport}>{t("trends.actionsMenu.reportIncorrect")}</MenuButton>
            <a
              href={trend.url}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              onClick={close}
              className="block w-full rounded-lg px-3 py-1.5 text-left text-sm text-foreground hover:bg-muted"
            >
              {t("trends.actionsMenu.viewSource")}
            </a>
            <div className="my-1 border-t border-border" />
            <MenuButton onClick={handleGenerateIdeas}>{t("trends.actionsMenu.generateIdeas")}</MenuButton>
            <MenuButton onClick={handleCreateNote}>{t("trends.actionsMenu.createNote")}</MenuButton>
            <MenuButton onClick={handleCreatePublication}>{t("trends.actionsMenu.createPublication")}</MenuButton>
            <MenuButton onClick={handleAddToCalendar}>{t("trends.actionsMenu.addToCalendar")}</MenuButton>
          </div>
        </>
      )}
    </div>
  );
}

function MenuButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="block w-full rounded-lg px-3 py-1.5 text-left text-sm text-foreground hover:bg-muted"
    >
      {children}
    </button>
  );
}
