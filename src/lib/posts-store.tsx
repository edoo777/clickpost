"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { posts as demoPosts } from "@/lib/demo-data";
import type { Publication } from "@/types/publication";

interface PostsSessionValue {
  posts: Publication[];
  addPosts: (newPosts: Publication[]) => void;
  updatePost: (id: string, publication: Publication) => void;
}

const PostsSessionContext = createContext<PostsSessionValue | null>(null);

export function PostsSessionProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Publication[]>(demoPosts);

  const value = useMemo<PostsSessionValue>(
    () => ({
      posts,
      addPosts: (newPosts) => setPosts((prev) => [...prev, ...newPosts]),
      updatePost: (id, publication) =>
        setPosts((prev) => prev.map((post) => (post.id === id ? publication : post))),
    }),
    [posts]
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
