import type { ReactNode } from "react";
import { FloatingAssistantButton } from "@/components/layout/FloatingAssistantButton";
import { Sidebar } from "@/components/layout/Sidebar";
import { AccountsSessionProvider } from "@/lib/accounts-store";
import { CampaignsSessionProvider } from "@/lib/campaigns-store";
import { ContentWorkspaceProvider } from "@/lib/content-workspace-store";
import { PostsSessionProvider } from "@/lib/posts-store";
import { SettingsSessionProvider } from "@/lib/settings-store";
import { TeamSessionProvider } from "@/lib/team-store";
import { ThemesSessionProvider } from "@/lib/themes-store";
import { UserProfileSessionProvider } from "@/lib/user-profile-store";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <PostsSessionProvider>
      <AccountsSessionProvider>
        <TeamSessionProvider>
          <SettingsSessionProvider>
            <ThemesSessionProvider>
              <CampaignsSessionProvider>
                <ContentWorkspaceProvider>
                  <UserProfileSessionProvider>
                    <div className="flex min-h-screen w-full bg-zinc-50 dark:bg-zinc-950">
                      <Sidebar />
                      <main className="flex-1 overflow-y-auto px-6 py-8 sm:px-10">
                        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">{children}</div>
                      </main>
                      <FloatingAssistantButton />
                    </div>
                  </UserProfileSessionProvider>
                </ContentWorkspaceProvider>
              </CampaignsSessionProvider>
            </ThemesSessionProvider>
          </SettingsSessionProvider>
        </TeamSessionProvider>
      </AccountsSessionProvider>
    </PostsSessionProvider>
  );
}
