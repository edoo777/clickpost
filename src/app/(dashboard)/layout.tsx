import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { AccountsSessionProvider } from "@/lib/accounts-store";
import { PostsSessionProvider } from "@/lib/posts-store";
import { TeamSessionProvider } from "@/lib/team-store";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <PostsSessionProvider>
      <AccountsSessionProvider>
        <TeamSessionProvider>
          <div className="flex min-h-screen w-full bg-zinc-50 dark:bg-zinc-950">
            <Sidebar />
            <main className="flex-1 overflow-y-auto px-6 py-8 sm:px-10">
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">{children}</div>
            </main>
          </div>
        </TeamSessionProvider>
      </AccountsSessionProvider>
    </PostsSessionProvider>
  );
}
