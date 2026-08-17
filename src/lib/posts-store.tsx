"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useSyncedPersistedState } from "@/lib/sync/use-synced-state";
import {
  buildNewPost,
  changePublicationStatus,
  duplicatePublication,
  type NewPostInput,
} from "@/lib/posts";
import type { Publication, PublicationStatus } from "@/types/publication";

function withTimestamps(publication: Publication): Publication {
  const now = new Date().toISOString();
  return {
    ...publication,
    createdAt: publication.createdAt ?? now,
    updatedAt: now,
  };
}

interface PostsSessionValue {
  posts: Publication[];
  addPosts: (newPosts: Publication[]) => void;
  updatePost: (id: string, publication: Publication) => void;
  createPost: (input: NewPostInput) => void;
  patchPost: (id: string, patch: Partial<Publication>) => void;
  removePost: (id: string) => void;
  duplicatePost: (id: string) => void;
  changeStatus: (id: string, status: PublicationStatus, actorName: string) => void;
}

const PostsSessionContext = createContext<PostsSessionValue | null>(null);

export function PostsSessionProvider({ children }: { children: ReactNode }) {
  // Jamais de données de démonstration présentées comme réelles par défaut (voir brands-store.tsx
  // pour le même principe) — corrige un tableau de bord affichant de fausses publications/tâches
  // d'approbation à un nouvel utilisateur, trouvé lors d'un audit autonome (2026-08-17).
  const [posts, setPosts] = useSyncedPersistedState<"posts">("posts", [], "posts");

  const value = useMemo<PostsSessionValue>(
    () => ({
      posts,
      addPosts: (newPosts) => setPosts((prev) => [...prev, ...newPosts.map(withTimestamps)]),
      updatePost: (id, publication) =>
        setPosts((prev) => prev.map((post) => (post.id === id ? withTimestamps(publication) : post))),
      createPost: (input) => setPosts((prev) => [...prev, buildNewPost(input)]),
      patchPost: (id, patch) =>
        setPosts((prev) =>
          prev.map((post) => (post.id === id ? withTimestamps({ ...post, ...patch }) : post))
        ),
      removePost: (id) => setPosts((prev) => prev.filter((post) => post.id !== id)),
      duplicatePost: (id) =>
        setPosts((prev) => {
          const source = prev.find((post) => post.id === id);
          if (!source) return prev;
          return [...prev, duplicatePublication(source)];
        }),
      changeStatus: (id, status, actorName) =>
        setPosts((prev) =>
          prev.map((post) => (post.id === id ? changePublicationStatus(post, status, actorName) : post))
        ),
    }),
    [posts, setPosts]
  );

  return <PostsSessionContext.Provider value={value}>{children}</PostsSessionContext.Provider>;
}

export function usePostsSession() {
  const context = useContext(PostsSessionContext);
  if (!context) {
    throw new Error("usePostsSession must be used within a PostsSessionProvider");
  }
  return context;
}
