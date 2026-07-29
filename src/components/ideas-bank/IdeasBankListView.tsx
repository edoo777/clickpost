"use client";

import { useMemo, useState } from "react";
import { BulkScheduleModal } from "@/components/ideas-bank/BulkScheduleModal";
import { IdeaBankCard } from "@/components/ideas-bank/IdeaBankCard";
import {
  DEFAULT_IDEAS_BANK_FILTERS,
  IdeasBankFilters,
  type IdeasBankFiltersValue,
} from "@/components/ideas-bank/IdeasBankFilters";
import { IdeasBankKanban } from "@/components/ideas-bank/IdeasBankKanban";
import { IdeasBankTable } from "@/components/ideas-bank/IdeasBankTable";
import { IdeaQuickEditPanel, type IdeaQuickEditValue } from "@/components/ideas-bank/IdeaQuickEditPanel";
import { useBrandsSession } from "@/lib/brands-store";
import { useCampaignsSession } from "@/lib/campaigns-store";
import { useContentWorkspace } from "@/lib/content-workspace-store";
import { brandEditorialCalendars } from "@/lib/editorial-calendars";
import type { IdeaScheduleAssignment } from "@/lib/idea-scheduling";
import {
  buildNewIdea,
  duplicateIdea,
  filterIdeas,
  groupIdeasByBatch,
  groupIdeasByCampaign,
  groupIdeasByTheme,
  searchIdeas,
  type IdeaGroup,
} from "@/lib/ideas";
import { usePostsSession } from "@/lib/posts-store";
import { useThemesSession } from "@/lib/themes-store";
import type { Idea } from "@/types/idea";

export function IdeasBankListView() {
  const { ideas, topicBatches, addIdea, updateIdea, archiveIdea, restoreIdea, removeIdea } =
    useContentWorkspace();
  const { brands } = useBrandsSession();
  const { themes } = useThemesSession();
  const { campaigns } = useCampaignsSession();
  const { posts, patchPost } = usePostsSession();

  function syncScheduleToPublication(idea: Idea | undefined, scheduledFor: string | undefined) {
    if (!idea?.publicationId || !scheduledFor) return;
    const publication = posts.find((post) => post.id === idea.publicationId);
    if (!publication || publication.scheduledFor === scheduledFor) return;
    patchPost(publication.id, { scheduledFor });
  }

  const [filters, setFilters] = useState<IdeasBankFiltersValue>(DEFAULT_IDEAS_BANK_FILTERS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [panelState, setPanelState] = useState<{ mode: "create" | "edit"; idea: Idea | null } | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const selectedIdeas = useMemo(() => ideas.filter((idea) => selectedIds.has(idea.id)), [ideas, selectedIds]);
  const selectedBrandIds = useMemo(
    () => new Set(selectedIdeas.map((idea) => idea.brandId)),
    [selectedIdeas]
  );
  const isMixedBrands = selectedBrandIds.size > 1;
  const selectionCalendar = useMemo(() => {
    if (selectedBrandIds.size !== 1) return undefined;
    const [brandId] = selectedBrandIds;
    return brandEditorialCalendars.find((calendar) => calendar.brandId === brandId);
  }, [selectedBrandIds]);

  const filtered = useMemo(() => {
    const byFilters = filterIdeas(ideas, {
      brandId: filters.brandId !== "all" ? filters.brandId : undefined,
      themeId: filters.themeId !== "all" ? filters.themeId : undefined,
      batchId: filters.batchId !== "all" ? filters.batchId : undefined,
      campaignId: filters.campaignId !== "all" ? filters.campaignId : undefined,
      source: filters.source !== "all" ? filters.source : undefined,
      status: filters.status !== "all" ? filters.status : undefined,
      priority: filters.priority !== "all" ? filters.priority : undefined,
      platform: filters.platform !== "all" ? filters.platform : undefined,
      format: filters.format !== "all" ? filters.format : undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      transformState: filters.transformState,
      includeArchived: filters.includeArchived,
    });
    return searchIdeas(byFilters, filters.search).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [ideas, filters]);

  const groups: IdeaGroup[] | null = useMemo(() => {
    if (filters.groupBy === "theme") return groupIdeasByTheme(filtered, themes);
    if (filters.groupBy === "batch") return groupIdeasByBatch(filtered, topicBatches);
    if (filters.groupBy === "campaign") return groupIdeasByCampaign(filtered, campaigns);
    return null;
  }, [filters.groupBy, filtered, themes, topicBatches, campaigns]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleArchiveSelection() {
    selectedIds.forEach((id) => archiveIdea(id));
    setSelectedIds(new Set());
  }

  function handleRestoreSelection() {
    selectedIds.forEach((id) => restoreIdea(id));
    setSelectedIds(new Set());
  }

  function handleDeleteSelection() {
    if (!window.confirm(`Supprimer définitivement ${selectedIds.size} idée(s) ?`)) return;
    selectedIds.forEach((id) => removeIdea(id));
    setSelectedIds(new Set());
  }

  function handleConfirmSchedule(assignments: IdeaScheduleAssignment[]) {
    assignments.forEach((assignment) => {
      updateIdea(assignment.ideaId, { scheduledFor: assignment.scheduledFor });
      const idea = ideas.find((candidate) => candidate.id === assignment.ideaId);
      syncScheduleToPublication(idea, assignment.scheduledFor);
    });
    setIsScheduleModalOpen(false);
    setSelectedIds(new Set());
  }

  function openCreatePanel() {
    setPanelState({ mode: "create", idea: null });
  }

  function openEditPanel(id: string) {
    const idea = ideas.find((candidate) => candidate.id === id);
    if (!idea) return;
    setPanelState({ mode: "edit", idea });
  }

  function closePanel() {
    setPanelState(null);
  }

  function handleSavePanel(value: IdeaQuickEditValue) {
    const common = {
      brandId: value.brandId,
      title: value.title.trim(),
      themeId: value.themeId || undefined,
      campaignId: value.campaignId || undefined,
      description: value.description.trim() || undefined,
      priority: value.priority || undefined,
      platform: value.platform || undefined,
      format: value.format || undefined,
      scheduledFor: !value.datePending && value.scheduledFor ? value.scheduledFor : undefined,
      owner: value.owner.trim() || undefined,
      quickNotes: value.quickNotes.trim() || undefined,
    };

    if (panelState?.mode === "edit" && panelState.idea) {
      updateIdea(panelState.idea.id, common);
      syncScheduleToPublication(panelState.idea, common.scheduledFor);
    } else {
      addIdea(buildNewIdea(common));
    }
    closePanel();
  }

  function handleDuplicateFromPanel() {
    if (!panelState?.idea) return;
    addIdea(duplicateIdea(panelState.idea));
    closePanel();
  }

  function handleArchiveFromPanel() {
    if (!panelState?.idea) return;
    archiveIdea(panelState.idea.id);
    closePanel();
  }

  function handleRestoreFromPanel() {
    if (!panelState?.idea) return;
    restoreIdea(panelState.idea.id);
    closePanel();
  }

  function handleDeleteFromPanel() {
    if (!panelState?.idea) return;
    if (!window.confirm(`Supprimer définitivement l'idée « ${panelState.idea.title || "sans titre"} » ?`)) return;
    removeIdea(panelState.idea.id);
    closePanel();
  }

  function renderIdeas(list: Idea[]) {
    if (filters.viewMode === "table") {
      return <IdeasBankTable ideas={list} selectedIds={selectedIds} onToggleSelect={toggleSelect} onOpen={openEditPanel} />;
    }
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((idea) => (
          <IdeaBankCard
            key={idea.id}
            idea={idea}
            isSelected={selectedIds.has(idea.id)}
            onToggleSelect={() => toggleSelect(idea.id)}
            onOpen={() => openEditPanel(idea.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground ">
          Banque d&apos;idées
        </h1>
        <p className="text-sm text-muted-foreground ">
          {filtered.length} idée{filtered.length > 1 ? "s" : ""} affichée{filtered.length > 1 ? "s" : ""}
        </p>
      </header>

      <IdeasBankFilters value={filters} onChange={setFilters} batches={topicBatches} onNewIdea={openCreatePanel} />

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-zinc-50 px-3 py-2  dark:bg-zinc-900/40">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {selectedIds.size} idée{selectedIds.size > 1 ? "s" : ""} sélectionnée{selectedIds.size > 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-sm font-medium text-muted-foreground underline-offset-2 hover:underline "
            >
              Tout désélectionner
            </button>
            <button
              type="button"
              onClick={handleRestoreSelection}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
            >
              Restaurer la sélection
            </button>
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(true)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
            >
              Planifier la sélection
            </button>
            <button
              type="button"
              onClick={handleArchiveSelection}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
            >
              Archiver la sélection
            </button>
            <button
              type="button"
              onClick={handleDeleteSelection}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              Supprimer la sélection
            </button>
          </div>
        </div>
      )}

      {filters.viewMode === "kanban" ? (
        filters.brandId === "all" ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
            Sélectionnez une marque pour afficher le Kanban.
          </p>
        ) : (
          <IdeasBankKanban
            brandId={filters.brandId}
            ideas={filtered}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onOpen={openEditPanel}
          />
        )
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-muted-foreground dark:border-white/[.12] ">
          Aucune idée ne correspond à ces critères. Générez un bloc de sujets ou créez une idée
          manuellement pour commencer.
        </p>
      ) : groups ? (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <div key={group.key} className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-foreground ">
                {group.label}{" "}
                <span className="font-normal text-muted-foreground ">({group.ideas.length})</span>
              </h2>
              {renderIdeas(group.ideas)}
            </div>
          ))}
        </div>
      ) : (
        renderIdeas(filtered)
      )}

      {panelState && (
        <IdeaQuickEditPanel
          idea={panelState.idea}
          defaultBrandId={filters.brandId !== "all" ? filters.brandId : (brands[0]?.id ?? "")}
          onClose={closePanel}
          onSave={handleSavePanel}
          onDuplicate={handleDuplicateFromPanel}
          onArchive={handleArchiveFromPanel}
          onRestore={handleRestoreFromPanel}
          onDelete={handleDeleteFromPanel}
        />
      )}

      {isScheduleModalOpen && (
        <BulkScheduleModal
          ideas={selectedIdeas}
          isMixedBrands={isMixedBrands}
          calendar={selectionCalendar}
          themes={themes}
          onClose={() => setIsScheduleModalOpen(false)}
          onConfirm={handleConfirmSchedule}
        />
      )}
    </div>
  );
}
