"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { posts as demoPosts } from "@/lib/demo-data";
import type { ScheduledPost } from "@/types/dashboard";

interface PostsSessionValue {
  posts: ScheduledPost[];
  addPosts: (newPosts: ScheduledPost[]) => void;
}

const PostsSessionContext = createContext<PostsSessionValue | null>(null);

export function PostsSessionProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<ScheduledPost[]>(demoPosts);

  const value = useMemo<PostsSessionValue>(
    () => ({
      posts,
      addPosts: (newPosts) => setPosts((prev) => [...prev, ...newPosts]),
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
