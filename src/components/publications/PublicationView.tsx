"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { platformIcons } from "@/components/icons";
import { PublicationForm } from "@/components/publications/PublicationForm";
import { PublicationPreview } from "@/components/publications/PublicationPreview";
import { useAccountsSession } from "@/lib/accounts-store";
import { brandProfiles } from "@/lib/brand-profiles";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/post-status";
import { usePostsSession } from "@/lib/posts-store";
import type { SocialAccount } from "@/types/dashboard";
import type { Publication } from "@/types/publication";

function buildBlankPublication(accounts: SocialAccount[]): Publication {
  const brand = brandProfiles[0];
  const account =
    accounts.find((candidate) => candidate.brand === brand.name && candidate.status === "connected") ??
    accounts.find((candidate) => candidate.brand === brand.name);

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
    status: "draft",
    owner: "",
    approver: "",
    internalNotes: "",
  };
}

interface PublicationViewProps {
  mode: "create" | "edit";
  id?: string;
}

export function PublicationView({ mode, id }: PublicationViewProps) {
  const router = useRouter();
  const { posts, addPosts, updatePost } = usePostsSession();
  const { accounts } = useAccountsSession();

  const existing = mode === "edit" ? posts.find((post) => post.id === id) : undefined;

  const [draft, setDraft] = useState<Publication>(() => existing ?? buildBlankPublication(accounts));
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
        <p className="rounded-xl border border-dashed border-black/[.12] px-4 py-8 text-center text-sm text-zinc-400 dark:border-white/[.12] dark:text-zinc-600">
          Publication introuvable.
        </p>
      </div>
    );
  }

  const displayed = isEditing ? draft : (existing ?? draft);
  const Icon = platformIcons[displayed.platform];

  function handleSave() {
    if (mode === "create") {
      const newPublication: Publication = { ...draft, id: crypto.randomUUID() };
      addPosts([newPublication]);
      router.push(`/publications/${newPublication.id}`);
      return;
    }
    updatePost(draft.id, draft);
    setIsEditing(false);
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
                className="rounded-lg border border-black/[.08] px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:border-white/[.08] dark:text-zinc-400 dark:hover:bg-zinc-900"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
              >
                Enregistrer
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleDuplicate}
                className="rounded-lg border border-black/[.08] px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:border-white/[.08] dark:text-zinc-400 dark:hover:bg-zinc-900"
              >
                Dupliquer
              </button>
              <button
                type="button"
                onClick={handleEditClick}
                className="rounded-lg border border-black/[.08] px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:border-white/[.08] dark:text-zinc-400 dark:hover:bg-zinc-900"
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
        <div className="lg:col-span-2">
          <PublicationForm publication={displayed} editable={isEditing} onChange={setDraft} />
        </div>
        <div className="lg:col-span-1">
          <PublicationPreview publication={displayed} />
        </div>
      </div>
    </div>
  );
}
