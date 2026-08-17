"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DisplayableTrend } from "@/components/trends/displayable-trend";
import { useContentWorkspace } from "@/lib/content-workspace-store";
import { useDevelopIdea } from "@/lib/develop-idea";
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
      notify("Session en cours de chargement — réessayez dans un instant.");
      return close();
    }
    if (!window.confirm(confirmLabel)) return close();
    saveTrend(
      { brandId: context.brandId, provider: trend.provider, externalId: trend.externalId, title: trend.title, sourceUrl: trend.url, status },
      userId
    );
    notify(status === "saved" ? "Tendance enregistrée." : status === "hidden" ? "Tendance masquée." : "Marquée non pertinente.");
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
      notify("Session en cours de chargement — réessayez dans un instant.");
      return close();
    }
    if (!window.confirm(`Créer une note dans la Banque d'idées à partir de « ${trend.title} » ?`)) return close();
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
    notify("Note créée — retrouvez-la dans l'onglet Notes de la Banque d'idées.");
    close();
  }

  function handleCreatePublication() {
    if (!window.confirm(`Créer une idée dans la Banque et ouvrir l'Atelier pour « ${trend.title} » ?`)) return close();
    const idea = buildIdeaFromTrend();
    addIdea(idea);
    close();
    developIdea(idea, "manual");
  }

  function handleAddToCalendar() {
    if (!window.confirm(`Créer une idée dans la Banque à partir de « ${trend.title} » et ouvrir le calendrier pour la planifier ?`)) return close();
    const idea = buildIdeaFromTrend();
    addIdea(idea);
    close();
    router.push("/calendrier");
  }

  async function handleReport() {
    const reason = window.prompt(`Signaler « ${trend.title} » comme incorrecte — pourquoi (facultatif) ?`);
    if (reason === null) return close(); // annulé
    const outcome = await reportIncorrectInformation({ itemId: trend.id, sourceUrl: trend.url, reason: reason || undefined });
    notify(outcome.status === "ok" ? "Signalement enregistré, merci." : "Le signalement n'a pas pu être envoyé.");
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
        Actions
      </button>

      {feedback && <p className="absolute -bottom-6 left-0 whitespace-nowrap text-[11px] text-emerald-600 dark:text-emerald-400">{feedback}</p>}

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={close} aria-hidden="true" />
          <div role="menu" className="absolute right-0 z-20 mt-1 w-64 rounded-xl border border-border bg-surface-elevated p-1.5 shadow-lg">
            <MenuButton onClick={() => handleSave("saved", `Enregistrer « ${trend.title} » ?`)}>Enregistrer</MenuButton>
            <MenuButton onClick={() => handleSave("hidden", `Masquer « ${trend.title} » de vos listes ?`)}>Masquer</MenuButton>
            <MenuButton onClick={() => handleSave("not_relevant", `Marquer « ${trend.title} » comme non pertinente ?`)}>Non pertinente</MenuButton>
            <MenuButton onClick={handleReport}>Signaler une information incorrecte</MenuButton>
            <a
              href={trend.url}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              onClick={close}
              className="block w-full rounded-lg px-3 py-1.5 text-left text-sm text-foreground hover:bg-muted"
            >
              Voir la source
            </a>
            <div className="my-1 border-t border-border" />
            <MenuButton onClick={handleGenerateIdeas}>Générer des idées</MenuButton>
            <MenuButton onClick={handleCreateNote}>Créer une note</MenuButton>
            <MenuButton onClick={handleCreatePublication}>Créer une publication</MenuButton>
            <MenuButton onClick={handleAddToCalendar}>Ajouter au calendrier</MenuButton>
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
