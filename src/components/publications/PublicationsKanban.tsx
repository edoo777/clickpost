"use client";

import { useState, type DragEvent } from "react";
import { platformIcons } from "@/components/icons";
import { useAccountsSession } from "@/lib/accounts-store";
import { useBrandsSession } from "@/lib/brands-store";
import { STATUS_STYLE, useStatusLabel } from "@/lib/post-status";
import { usePostsSession } from "@/lib/posts-store";
import { useTeamSession } from "@/lib/team-store";
import type { Publication, PublicationStatus } from "@/types/publication";

const COLUMN_STATUSES: PublicationStatus[] = [
  "idea",
  "to_develop",
  "content_generated",
  "draft",
  "in_production",
  "in_review",
  "needs_changes",
  "pending_client",
  "approved",
  "ready_to_schedule",
  "scheduled",
  "published",
  "failed",
  "rejected",
  "archived",
];

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

interface DropTarget {
  columnStatus: PublicationStatus;
  overId: string | null;
  position: "before" | "after";
}

function computeReorderedScheduledFor(columnPosts: Publication[], target: DropTarget, draggedId: string): string {
  const ordered = columnPosts.filter((post) => post.id !== draggedId);
  let insertIndex = ordered.length;
  if (target.overId) {
    const overIndex = ordered.findIndex((post) => post.id === target.overId);
    if (overIndex >= 0) insertIndex = target.position === "before" ? overIndex : overIndex + 1;
  }
  const before = ordered[insertIndex - 1];
  const after = ordered[insertIndex];
  const beforeTime = before ? new Date(before.scheduledFor).getTime() : undefined;
  const afterTime = after ? new Date(after.scheduledFor).getTime() : undefined;
  if (beforeTime !== undefined && afterTime !== undefined) {
    return new Date((beforeTime + afterTime) / 2).toISOString();
  }
  if (beforeTime !== undefined) return new Date(beforeTime + 60_000).toISOString();
  if (afterTime !== undefined) return new Date(afterTime - 60_000).toISOString();
  return new Date().toISOString();
}

interface PublicationsKanbanProps {
  publications: Publication[];
  onOpen: (id: string) => void;
}

export function PublicationsKanban({ publications, onOpen }: PublicationsKanbanProps) {
  const { patchPost, changeStatus, createPost } = usePostsSession();
  const { brands } = useBrandsSession();
  const { accounts } = useAccountsSession();
  const { members, currentUserId } = useTeamSession();
  const currentUserName = members.find((member) => member.id === currentUserId)?.name ?? "";
  const STATUS_LABEL = useStatusLabel();
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [quickCreateColumn, setQuickCreateColumn] = useState<PublicationStatus | null>(null);
  const [quickCreateTitle, setQuickCreateTitle] = useState("");
  const [quickCreateBrand, setQuickCreateBrand] = useState(brands[0]?.name ?? "");

  function columnPosts(status: PublicationStatus) {
    return publications
      .filter((post) => post.status === status)
      .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
  }

  function handleDragStart(event: DragEvent<HTMLDivElement>, id: string) {
    event.dataTransfer.setData("text/plain", id);
    event.dataTransfer.effectAllowed = "move";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, status: PublicationStatus) {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain");
    const target = dropTarget ?? { columnStatus: status, overId: null, position: "after" as const };
    setDropTarget(null);
    if (!id) return;
    const dragged = publications.find((post) => post.id === id);
    if (!dragged) return;
    // L'approbation ne doit jamais être un simple glisser-déposer : seule la colonne
    // « Actions d'approbation » de la fiche publication peut faire passer un contenu à
    // « Approuvé ». Un dépôt vers cette colonne est ignoré silencieusement (la carte revient à
    // sa place) plutôt que d'accepter une approbation sans validation.
    if (status === "approved" && dragged.status !== "approved") return;
    // La publication réelle (marquer comme publiée) exige aussi une confirmation explicite via le
    // panneau « Publication manuelle » de la fiche — jamais un simple glisser-déposer.
    if (status === "published" && dragged.status !== "published") return;
    // « Programmée » déclenche une publication LinkedIn réelle et automatique dès l'échéance (voir
    // le planificateur) : n'est atteignable que depuis une publication déjà approuvée, jamais par
    // un glisser-déposer direct depuis un statut antérieur à l'approbation. Un dépôt refusé revient
    // silencieusement à sa place, comme pour les deux règles ci-dessus. Appliqué en dernier
    // recours par un verrou côté base de données (voir la migration
    // publications_status_transition_guard), jamais uniquement ici.
    if (status === "scheduled" && !["approved", "ready_to_schedule", "scheduled", "failed"].includes(dragged.status)) return;
    const scheduledFor = computeReorderedScheduledFor(columnPosts(status), target, id);
    if (dragged.status !== status) {
      changeStatus(id, status, currentUserName);
    }
    patchPost(id, { scheduledFor });
  }

  function submitQuickCreate(status: PublicationStatus) {
    const brand = quickCreateBrand || brands[0]?.name || "";
    if (!brand || !quickCreateTitle.trim()) {
      setQuickCreateColumn(null);
      return;
    }
    const account = accounts.find((candidate) => candidate.brand === brand);
    createPost({
      brand,
      platform: account?.platform ?? "instagram",
      accountId: account?.id,
      format: "text",
      excerpt: quickCreateTitle.trim(),
      status,
    });
    setQuickCreateTitle("");
    setQuickCreateColumn(null);
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {COLUMN_STATUSES.map((status) => {
        const posts = columnPosts(status);
        const isDropActive = dropTarget?.columnStatus === status;
        return (
          <div
            key={status}
            onDragOver={(event) => {
              event.preventDefault();
              setDropTarget((prev) => (prev?.columnStatus === status ? prev : { columnStatus: status, overId: null, position: "after" }));
            }}
            onDragLeave={() => setDropTarget((prev) => (prev?.columnStatus === status ? null : prev))}
            onDrop={(event) => handleDrop(event, status)}
            className={`flex w-72 flex-shrink-0 flex-col gap-3 rounded-xl border p-3 ${
              isDropActive ? "border-violet-500 ring-1 ring-violet-500/20 dark:border-violet-400" : "border-border "
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[status]}`}>
                {STATUS_LABEL[status]}
              </span>
              <span className="text-xs text-muted-foreground ">{posts.length}</span>
            </div>

            <div className="flex flex-col gap-2">
              {posts.map((post) => {
                const Icon = platformIcons[post.platform];
                return (
                  <div
                    key={post.id}
                    draggable
                    onDragStart={(event) => handleDragStart(event, post.id)}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      const rect = event.currentTarget.getBoundingClientRect();
                      const position = event.clientY - rect.top < rect.height / 2 ? "before" : "after";
                      setDropTarget({ columnStatus: status, overId: post.id, position });
                    }}
                    className={`flex cursor-grab flex-col gap-2 rounded-lg border bg-surface p-3 active:cursor-grabbing  ${
                      dropTarget?.overId === post.id
                        ? "border-violet-500 ring-1 ring-violet-500/20 dark:border-violet-400"
                        : "border-border hover:border-zinc-400  dark:hover:border-white/[.16]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted ">
                        <Icon className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
                      </span>
                      <label className="sr-only" htmlFor={`status-${post.id}`}>
                        Changer le statut de {post.excerpt || "cette publication"}
                      </label>
                      <select
                        id={`status-${post.id}`}
                        value={post.status}
                        onChange={(event) => changeStatus(post.id, event.target.value as PublicationStatus, currentUserName)}
                        className="rounded-md border border-border bg-transparent px-1 py-0.5 text-[11px] text-muted-foreground "
                        aria-label={`Déplacer ${post.excerpt || "cette publication"} vers un autre statut (alternative au glisser-déposer)`}
                      >
                        {COLUMN_STATUSES.map((option) => (
                          <option
                            key={option}
                            value={option}
                            disabled={
                              (option === "approved" && post.status !== "approved") ||
                              (option === "published" && post.status !== "published")
                            }
                          >
                            {STATUS_LABEL[option]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button type="button" onClick={() => onOpen(post.id)} className="flex flex-col gap-1 text-left hover:underline">
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        {post.excerpt || "Sans titre"}
                      </span>
                      <span className="text-xs text-muted-foreground ">
                        {post.brand} · {dateFormatter.format(new Date(post.scheduledFor))}
                      </span>
                    </button>
                  </div>
                );
              })}
              {posts.length === 0 && (
                <p className="rounded-lg border border-dashed border-border px-2 py-4 text-center text-xs text-muted-foreground  ">
                  Aucune publication
                </p>
              )}
            </div>

            {quickCreateColumn === status ? (
              <div className="flex flex-col gap-1.5">
                <select
                  value={quickCreateBrand}
                  onChange={(event) => setQuickCreateBrand(event.target.value)}
                  className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-zinc-700   dark:text-zinc-300"
                >
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.name}>
                      {brand.name}
                    </option>
                  ))}
                </select>
                <input
                  autoFocus
                  value={quickCreateTitle}
                  onChange={(event) => setQuickCreateTitle(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") submitQuickCreate(status);
                    if (event.key === "Escape") setQuickCreateColumn(null);
                  }}
                  placeholder="Titre de la publication"
                  className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-zinc-700   dark:text-zinc-300"
                />
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => submitQuickCreate(status)}
                    className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-2 py-1 text-xs font-semibold text-white"
                  >
                    Créer
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickCreateColumn(null)}
                    className="rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground "
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setQuickCreateColumn(status);
                  setQuickCreateBrand(brands[0]?.name ?? "");
                }}
                className="rounded-lg border border-dashed border-zinc-400 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:border-zinc-500 dark:border-white/[.16] "
              >
                + Créer ici
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
