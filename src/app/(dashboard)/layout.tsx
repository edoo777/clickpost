import type { ReactNode } from "react";
import { FloatingAssistantButton } from "@/components/layout/FloatingAssistantButton";
import { Sidebar } from "@/components/layout/Sidebar";
import { WorkspacePersistenceProvider } from "@/components/persistence/WorkspacePersistenceProvider";
import { AccountsSessionProvider } from "@/lib/accounts-store";
import { CampaignsSessionProvider } from "@/lib/campaigns-store";
import { ContentWorkspaceProvider } from "@/lib/content-workspace-store";
import { PostsSessionProvider } from "@/lib/posts-store";
import { SettingsSessionProvider } from "@/lib/settings-store";
import { SidebarStateProvider } from "@/lib/sidebar-store";
import { TeamSessionProvider } from "@/lib/team-store";
import { ThemesSessionProvider } from "@/lib/themes-store";
import { UserProfileSessionProvider } from "@/lib/user-profile-store";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <WorkspacePersistenceProvider>
      <PostsSessionProvider>
        <AccountsSessionProvider>
          <TeamSessionProvider>
            <SettingsSessionProvider>
              <ThemesSessionProvider>
                <CampaignsSessionProvider>
                  <ContentWorkspaceProvider>
                    <UserProfileSessionProvider>
                      <SidebarStateProvider>
                        <div className="flex min-h-screen w-full flex-col bg-background">
                          <Sidebar />
                          <main className="flex-1 overflow-y-auto px-4 py-6 transition-[margin] duration-[250ms] ease-in-out motion-reduce:transition-none sm:px-6 lg:ml-[var(--sidebar-w)] lg:px-10 lg:py-8">
                            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">{children}</div>
                          </main>
                          <FloatingAssistantButton />
                        </div>
                      </SidebarStateProvider>
                    </UserProfileSessionProvider>
                  </ContentWorkspaceProvider>
                </CampaignsSessionProvider>
              </ThemesSessionProvider>
            </SettingsSessionProvider>
          </TeamSessionProvider>
        </AccountsSessionProvider>
      </PostsSessionProvider>
    </WorkspacePersistenceProvider>
  );
}
