"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { platformIcons } from "@/components/icons";
import { ApprovalActions } from "@/components/publications/ApprovalActions";
import { ClaudeGenerationPanel } from "@/components/publications/ClaudeGenerationPanel";
import { CollaborationPanel } from "@/components/publications/CollaborationPanel";
import { HistoryTimeline } from "@/components/publications/HistoryTimeline";
import { LinkedInPublishAction } from "@/components/publications/LinkedInPublishAction";
import { ManualPublishPanel } from "@/components/publications/ManualPublishPanel";
import { PromotionChecklist } from "@/components/publications/PromotionChecklist";
import { PublicationForm } from "@/components/publications/PublicationForm";
import { PublicationModeToggle, type PublicationCreationMode } from "@/components/publications/PublicationModeToggle";
import { PublicationPreview } from "@/components/publications/PublicationPreview";
import { useAccountsSession } from "@/lib/accounts-store";
import { approvePublication, hasApprovedContentChanged, rejectPublication, requestChanges } from "@/lib/approval";
import { useBrandsSession } from "@/lib/brands-store";
import { useContentWorkspace } from "@/lib/content-workspace-store";
import { buildIdeaFromSeed, useDevelopIdea } from "@/lib/develop-idea";
import { mapPublicationStatusToIdeaStatus } from "@/lib/idea-publication-sync";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/post-status";
import { usePostsSession } from "@/lib/posts-store";
import { buildDefaultPromotionTasks, updateTaskInList } from "@/lib/promotion";
import { useSettingsSession } from "@/lib/settings-store";
import { deleteAllPublicationMedia } from "@/lib/supabase/publication-media-storage";
import { useWorkspaceSession } from "@/lib/supabase/workspace-provider";
import { useTeamSession } from "@/lib/team-store";
import type { Brand } from "@/types/brand";
import type { SocialAccount } from "@/types/dashboard";
import type { Idea } from "@/types/idea";
import type { PromotionTask } from "@/types/promotion";
import type { Publication, PublicationHistoryEntry } from "@/types/publication";
import type { PublishAttempt } from "@/types/publishing-provider";
import type { AgencySettings } from "@/types/settings";
import type { TeamMember } from "@/types/team";

function buildBlankPublication(
  accounts: SocialAccount[],
  settings: AgencySettings,
  members: TeamMember[],
  brand: Brand | undefined,
  defaultDate?: string | null,
  defaultTitle?: string | null
): Publication {
  const account = brand
    ? accounts.find((candidate) => candidate.brand === brand.name && candidate.status === "connected") ??
      accounts.find((candidate) => candidate.brand === brand.name)
    : undefined;

  const defaultOwner = members.find((member) => member.id === settings.workflow.defaultOwnerId)?.name ?? "";
  const defaultApprover = members.find((member) => member.id === settings.workflow.defaultApproverId)?.name ?? "";
  const dateOnly = defaultDate && /^\d{4}-\d{2}-\d{2}$/.test(defaultDate) ? defaultDate : new Date().toISOString().slice(0, 10);

  return {
    // Généré dès l'ouverture du formulaire (pas seulement à l'enregistrement) : un téléversement
    // de média a besoin d'un chemin de stockage stable dès le premier fichier sélectionné.
    id: crypto.randomUUID(),
    brand: brand?.name ?? "",
    accountId: account?.id ?? "",
    platform: account?.platform ?? brand?.socialPlatforms[0] ?? "instagram",
    scheduledFor: `${dateOnly}T09:00:00`,
    timeZone: "America/Toronto",
    theme: "",
    format: "image",
    objective: "",
    excerpt: defaultTitle ?? "",
    text: "",
    cta: "",
    hashtags: [],
    firstComment: "",
    media: [],
    status: settings.workflow.initialStatus,
    owner: defaultOwner,
    approver: defaultApprover,
    internalNotes: "",
    comments: [],
    history: [],
  };
}

interface PublicationViewProps {
  mode: "create" | "edit";
  id?: string;
}

export function PublicationView({ mode, id }: PublicationViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { posts, addPosts, updatePost } = usePostsSession();
  const { addIdea, updateIdea } = useContentWorkspace();
  const { developIdea } = useDevelopIdea();
  const { accounts, updateAccount } = useAccountsSession();
  const { brands } = useBrandsSession();
  const { members, currentUserId } = useTeamSession();
  const { settings } = useSettingsSession();
  const { workspace, isAdmin } = useWorkspaceSession();
  const currentUserName = members.find((member) => member.id === currentUserId)?.name ?? "";

  const from = searchParams.get("from");
  const backLabel = from === "calendrier" ? "← Retour au calendrier" : "← Retour à la liste";
  const returnSuffix = from ? `?from=${from}` : "";

  function goBackToList() {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push(from === "calendrier" ? "/calendrier" : "/publications");
  }

  const existing = mode === "edit" ? posts.find((post) => post.id === id) : undefined;
  const brandIdParam = searchParams.get("brandId");
  const defaultBrand = (brandIdParam ? brands.find((brand) => brand.id === brandIdParam) : undefined) ?? brands[0];

  const [draft, setDraft] = useState<Publication>(
    () =>
      existing ??
      buildBlankPublication(accounts, settings, members, defaultBrand, searchParams.get("date"), searchParams.get("title"))
  );
  const [isEditing, setIsEditing] = useState(mode === "create");
  const [creationMode, setCreationMode] = useState<PublicationCreationMode>("manual");
  const [lastAiSnapshot, setLastAiSnapshot] = useState<Publication | null>(null);

  function applyAiPatch(patch: Partial<Publication>) {
    setLastAiSnapshot(draft);
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function handleUndoAi() {
    if (!lastAiSnapshot) return;
    setDraft(lastAiSnapshot);
    setLastAiSnapshot(null);
  }

  if (mode === "edit" && !existing) {
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={goBackToList}
          className="w-fit text-sm font-medium text-muted-foreground hover:underline "
        >
          {backLabel}
        </button>
        <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-muted-foreground dark:border-white/[.12] ">
          Publication introuvable.
        </p>
      </div>
    );
  }

  const displayed = isEditing ? draft : (existing ?? draft);
  const Icon = platformIcons[displayed.platform];

  function syncToIdea(previous: Publication, updated: Publication) {
    if (!updated.ideaId) return;
    const patch: Partial<Idea> = {};
    if (updated.status !== previous.status) {
      const mapped = mapPublicationStatusToIdeaStatus(updated.status);
      if (mapped) patch.status = mapped;
    }
    if (updated.scheduledFor !== previous.scheduledFor) {
      patch.scheduledFor = updated.scheduledFor;
    }
    if (Object.keys(patch).length > 0) {
      updateIdea(updated.ideaId, patch);
    }
  }

  function handleSave() {
    if (mode === "create") {
      // L'id a déjà été généré à l'ouverture du formulaire (voir buildBlankPublication) — jamais
      // régénéré ici, pour rester cohérent avec le chemin de stockage des médias déjà téléversés.
      addPosts([draft]);
      router.push(`/publications/${draft.id}${returnSuffix}`);
      return;
    }
    // Une publication déjà approuvée ne doit jamais être modifiée silencieusement : toute
    // modification de son contenu la remet automatiquement en révision, avec une entrée
    // d'historique distincte qui explique pourquoi le statut a changé.
    const revertedToReview = Boolean(
      existing && existing.status === "approved" && hasApprovedContentChanged(existing, draft)
    );
    const historyEntry: PublicationHistoryEntry = {
      id: crypto.randomUUID(),
      action: revertedToReview ? "Repassée en révision (modifiée après approbation)" : "Modifiée",
      actorName: currentUserName,
      createdAt: new Date().toISOString(),
    };
    const updated: Publication = {
      ...draft,
      status: revertedToReview ? "in_review" : draft.status,
      history: [...draft.history, historyEntry],
    };
    updatePost(updated.id, updated);
    if (existing) syncToIdea(existing, updated);
    setIsEditing(false);
  }

  function handleAddComment(audience: "internal" | "client", text: string) {
    if (!existing) return;
    const now = new Date().toISOString();
    const updated: Publication = {
      ...existing,
      comments: [
        ...existing.comments,
        { id: crypto.randomUUID(), authorName: currentUserName, audience, text, createdAt: now },
      ],
      history: [
        ...existing.history,
        { id: crypto.randomUUID(), action: "Commentaire ajouté", actorName: currentUserName, createdAt: now },
      ],
    };
    updatePost(updated.id, updated);
    if (isEditing) setDraft(updated);
  }

  function handleApprove() {
    if (!existing) return;
    const updated = approvePublication(existing, currentUserName);
    updatePost(updated.id, updated);
    syncToIdea(existing, updated);
    if (isEditing) setDraft(updated);
  }

  function handleRequestChanges(note: string) {
    if (!existing) return;
    const updated = requestChanges(existing, note, currentUserName);
    updatePost(updated.id, updated);
    syncToIdea(existing, updated);
    if (isEditing) setDraft(updated);
  }

  function handleReject(reason: string) {
    if (!existing) return;
    const updated = rejectPublication(existing, reason, currentUserName);
    updatePost(updated.id, updated);
    syncToIdea(existing, updated);
    if (isEditing) setDraft(updated);
  }

  function handleMarkPublished() {
    if (!existing) return;
    const now = new Date().toISOString();
    const updated: Publication = {
      ...existing,
      status: "published",
      publishAttempts: [
        ...(existing.publishAttempts ?? []),
        { id: crypto.randomUUID(), mode: "manual", status: "success", actorName: currentUserName, createdAt: now },
      ],
      // Générée une seule fois — une republication après un échec ne doit jamais réinitialiser
      // une checklist de promotion déjà commencée.
      promotionTasks: existing.promotionTasks && existing.promotionTasks.length > 0
        ? existing.promotionTasks
        : buildDefaultPromotionTasks(existing.owner),
      history: [
        ...existing.history,
        { id: crypto.randomUUID(), action: "Publiée manuellement", actorName: currentUserName, createdAt: now },
      ],
    };
    updatePost(updated.id, updated);
    syncToIdea(existing, updated);
    if (isEditing) setDraft(updated);
  }

  function handleUpdatePromotionTask(taskId: string, patch: Partial<PromotionTask>) {
    if (!existing) return;
    const updated: Publication = { ...existing, promotionTasks: updateTaskInList(existing.promotionTasks ?? [], taskId, patch) };
    updatePost(updated.id, updated);
    if (isEditing) setDraft(updated);
  }

  function handleMarkFailed(errorMessage: string) {
    if (!existing) return;
    const now = new Date().toISOString();
    const updated: Publication = {
      ...existing,
      status: "failed",
      publishAttempts: [
        ...(existing.publishAttempts ?? []),
        { id: crypto.randomUUID(), mode: "manual", status: "failed", actorName: currentUserName, createdAt: now, errorMessage },
      ],
      history: [
        ...existing.history,
        { id: crypto.randomUUID(), action: "Publication signalée en échec", actorName: currentUserName, createdAt: now, note: errorMessage },
      ],
    };
    updatePost(updated.id, updated);
    syncToIdea(existing, updated);
    if (isEditing) setDraft(updated);
  }

  function handleLinkedInPublished(attempt: PublishAttempt, externalPostId: string) {
    if (!existing) return;
    const now = new Date().toISOString();
    const updated: Publication = {
      ...existing,
      status: "published",
      publishAttempts: [...(existing.publishAttempts ?? []), attempt],
      promotionTasks: existing.promotionTasks && existing.promotionTasks.length > 0
        ? existing.promotionTasks
        : buildDefaultPromotionTasks(existing.owner),
      history: [
        ...existing.history,
        { id: crypto.randomUUID(), action: `Publiée par API LinkedIn (${externalPostId})`, actorName: currentUserName, createdAt: now },
      ],
    };
    updatePost(updated.id, updated);
    syncToIdea(existing, updated);
    if (isEditing) setDraft(updated);
  }

  function handleLinkedInAttemptFailed(attempt: PublishAttempt, isPermissionError: boolean) {
    if (!existing) return;
    const now = new Date().toISOString();
    const updated: Publication = {
      ...existing,
      publishAttempts: [...(existing.publishAttempts ?? []), attempt],
      history: [
        ...existing.history,
        { id: crypto.randomUUID(), action: "Tentative de publication LinkedIn échouée", actorName: currentUserName, createdAt: now, note: attempt.errorMessage },
      ],
    };
    updatePost(updated.id, updated);
    if (isEditing) setDraft(updated);
    if (isPermissionError) {
      const account = accounts.find((candidate) => candidate.id === existing.accountId);
      if (account) updateAccount(account.id, { status: "insufficient_permission" });
    }
  }

  function handleCancel() {
    if (mode === "create") {
      // Nettoyage best-effort des médias déjà téléversés sous cet id de brouillon — jamais de
      // blocage de la navigation si la suppression échoue (fichier déjà supprimé, réseau, etc.).
      if (workspace?.id && draft.media.length > 0) {
        const brandId = brands.find((brand) => brand.name === draft.brand)?.id;
        void deleteAllPublicationMedia(workspace.id, brandId, draft.id).catch(() => {});
      }
      goBackToList();
      return;
    }
    if (existing) setDraft(existing);
    setIsEditing(false);
  }

  function handleDuplicate() {
    if (!existing) return;
    const copy: Publication = {
      ...existing,
      id: crypto.randomUUID(),
      excerpt: `${existing.excerpt} (copie)`,
      status: "draft",
      // Une copie n'a jamais été publiée : elle ne doit hériter ni des tentatives de publication
      // ni de la checklist de promotion de l'originale.
      publishAttempts: [],
      promotionTasks: [],
    };
    addPosts([copy]);
    router.push(`/publications/${copy.id}${returnSuffix}`);
  }

  function handleEditClick() {
    if (existing) setDraft(existing);
    setIsEditing(true);
  }

  function handleRecycle() {
    if (!existing) return;
    const brandId = brands.find((candidate) => candidate.name === existing.brand)?.id ?? "";
    const idea = buildIdeaFromSeed({
      brandId,
      title: `${existing.excerpt || "Publication"} (recyclée)`,
      description: existing.objective || undefined,
      platform: existing.platform,
      format: existing.format,
      body: existing.text,
    });
    addIdea(idea);
    developIdea(idea, "manual");
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={goBackToList}
        className="w-fit text-sm font-medium text-muted-foreground hover:underline "
      >
        {backLabel}
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted ">
            <Icon className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          </span>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold tracking-tight text-foreground ">
              {displayed.excerpt || (mode === "create" ? "Nouvelle publication" : "Publication")}
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground ">{displayed.brand}</span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[displayed.status]}`}
              >
                {STATUS_LABEL[displayed.status]}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40"
              >
                Enregistrer
              </button>
            </>
          ) : (
            <>
              {existing && existing.status === "published" && (
                <>
                  <Link
                    href="/performances"
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
                  >
                    Analyser
                  </Link>
                  <button
                    type="button"
                    onClick={handleRecycle}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
                  >
                    Recycler en nouvelle idée
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={handleDuplicate}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
              >
                Dupliquer
              </button>
              <button
                type="button"
                onClick={handleEditClick}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
              >
                Modifier
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
          Les modifications restent en mémoire pour cette session uniquement — elles seront perdues
          au rechargement de la page.
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {isEditing && (
            <PublicationModeToggle mode={creationMode} onChange={setCreationMode} />
          )}
          {isEditing && creationMode === "claude" && (
            <ClaudeGenerationPanel
              publication={draft}
              onApplyPatch={applyAiPatch}
              canUndo={Boolean(lastAiSnapshot)}
              onUndo={handleUndoAi}
            />
          )}
          <PublicationForm publication={displayed} editable={isEditing} onChange={setDraft} />
          {existing && (
            <>
              <ApprovalActions
                publication={existing}
                canAct={isAdmin || (Boolean(currentUserName) && currentUserName === existing.approver)}
                onApprove={handleApprove}
                onRequestChanges={handleRequestChanges}
                onReject={handleReject}
              />
              <LinkedInPublishAction
                publication={existing}
                account={accounts.find((candidate) => candidate.id === existing.accountId)}
                onPublished={handleLinkedInPublished}
                onAttemptFailed={handleLinkedInAttemptFailed}
              />
              <ManualPublishPanel
                publication={existing}
                account={accounts.find((candidate) => candidate.id === existing.accountId)}
                onMarkPublished={handleMarkPublished}
                onMarkFailed={handleMarkFailed}
              />
              {existing.status === "published" && existing.promotionTasks && existing.promotionTasks.length > 0 && (
                <PromotionChecklist tasks={existing.promotionTasks} members={members} onUpdateTask={handleUpdatePromotionTask} />
              )}
              <CollaborationPanel
                publication={displayed}
                members={members}
                currentUserName={currentUserName}
                onAddComment={handleAddComment}
              />
              <HistoryTimeline history={displayed.history} />
            </>
          )}
        </div>
        <div className="lg:col-span-1">
          <PublicationPreview publication={displayed} />
        </div>
      </div>
    </div>
  );
}
