"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { platformIcons } from "@/components/icons";
import { ApprovalActions } from "@/components/publications/ApprovalActions";
import { CollaborationPanel } from "@/components/publications/CollaborationPanel";
import { HistoryTimeline } from "@/components/publications/HistoryTimeline";
import { PublicationForm } from "@/components/publications/PublicationForm";
import { PublicationPreview } from "@/components/publications/PublicationPreview";
import { useAccountsSession } from "@/lib/accounts-store";
import { approvePublication, rejectPublication, requestChanges } from "@/lib/approval";
import { brandProfiles } from "@/lib/brand-profiles";
import { useContentWorkspace } from "@/lib/content-workspace-store";
import { mapPublicationStatusToIdeaStatus } from "@/lib/idea-publication-sync";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/post-status";
import { usePostsSession } from "@/lib/posts-store";
import { useSettingsSession } from "@/lib/settings-store";
import { useTeamSession } from "@/lib/team-store";
import type { SocialAccount } from "@/types/dashboard";
import type { Idea } from "@/types/idea";
import type { Publication, PublicationHistoryEntry } from "@/types/publication";
import type { AgencySettings } from "@/types/settings";
import type { TeamMember } from "@/types/team";

function buildBlankPublication(
  accounts: SocialAccount[],
  settings: AgencySettings,
  members: TeamMember[]
): Publication {
  const brand = brandProfiles[0];
  const account =
    accounts.find((candidate) => candidate.brand === brand.name && candidate.status === "connected") ??
    accounts.find((candidate) => candidate.brand === brand.name);

  const defaultOwner = members.find((member) => member.id === settings.workflow.defaultOwnerId)?.name ?? "";
  const defaultApprover = members.find((member) => member.id === settings.workflow.defaultApproverId)?.name ?? "";

  return {
    id: "",
    brand: brand.name,
    accountId: account?.id ?? "",
    platform: account?.platform ?? brand.socialPlatforms[0] ?? "instagram",
    scheduledFor: `${new Date().toISOString().slice(0, 10)}T09:00:00`,
    timeZone: "America/Toronto",
    theme: "",
    format: "image",
    objective: "",
    excerpt: "",
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
  const { posts, addPosts, updatePost } = usePostsSession();
  const { updateIdea } = useContentWorkspace();
  const { accounts } = useAccountsSession();
  const { members, currentUserId } = useTeamSession();
  const { settings } = useSettingsSession();
  const currentUserName = members.find((member) => member.id === currentUserId)?.name ?? "";

  const existing = mode === "edit" ? posts.find((post) => post.id === id) : undefined;

  const [draft, setDraft] = useState<Publication>(
    () => existing ?? buildBlankPublication(accounts, settings, members)
  );
  const [isEditing, setIsEditing] = useState(mode === "create");

  if (mode === "edit" && !existing) {
    return (
      <div className="flex flex-col gap-4">
        <Link
          href="/publications"
          className="w-fit text-sm font-medium text-zinc-500 hover:underline dark:text-zinc-400"
        >
          ← Retour à la liste
        </Link>
        <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-400 dark:border-white/[.12] dark:text-zinc-600">
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
      const newPublication: Publication = { ...draft, id: crypto.randomUUID() };
      addPosts([newPublication]);
      router.push(`/publications/${newPublication.id}`);
      return;
    }
    const historyEntry: PublicationHistoryEntry = {
      id: crypto.randomUUID(),
      action: "Modifiée",
      actorName: currentUserName,
      createdAt: new Date().toISOString(),
    };
    const updated: Publication = { ...draft, history: [...draft.history, historyEntry] };
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

  function handleCancel() {
    if (mode === "create") {
      router.push("/publications");
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
    };
    addPosts([copy]);
    router.push(`/publications/${copy.id}`);
  }

  function handleEditClick() {
    if (existing) setDraft(existing);
    setIsEditing(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/publications"
        className="w-fit text-sm font-medium text-zinc-500 hover:underline dark:text-zinc-400"
      >
        ← Retour à la liste
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
            <Icon className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          </span>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              {displayed.excerpt || (mode === "create" ? "Nouvelle publication" : "Publication")}
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">{displayed.brand}</span>
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
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-white/[.1] dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
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
              <button
                type="button"
                onClick={handleDuplicate}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-white/[.1] dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
              >
                Dupliquer
              </button>
              <button
                type="button"
                onClick={handleEditClick}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-white/[.1] dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
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
          <PublicationForm publication={displayed} editable={isEditing} onChange={setDraft} />
          {existing && (
            <>
              <ApprovalActions
                publication={existing}
                onApprove={handleApprove}
                onRequestChanges={handleRequestChanges}
                onReject={handleReject}
              />
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
