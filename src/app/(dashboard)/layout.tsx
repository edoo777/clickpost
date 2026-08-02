import type { ReactNode } from "react";
import { DashboardMainContent } from "@/components/layout/DashboardMainContent";
import { FloatingAssistantButton } from "@/components/layout/FloatingAssistantButton";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { WorkspacePersistenceProvider } from "@/components/persistence/WorkspacePersistenceProvider";
import { AccountsSessionProvider } from "@/lib/accounts-store";
import { BrandsSessionProvider } from "@/lib/brands-store";
import { CampaignsSessionProvider } from "@/lib/campaigns-store";
import { ContentWorkspaceProvider } from "@/lib/content-workspace-store";
import { ImportantDatesSessionProvider } from "@/lib/important-dates-store";
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
          <BrandsSessionProvider>
            <TeamSessionProvider>
              <SettingsSessionProvider>
                <ThemesSessionProvider>
                  <CampaignsSessionProvider>
                    <ContentWorkspaceProvider>
                      <ImportantDatesSessionProvider>
                        <UserProfileSessionProvider>
                          <SidebarStateProvider>
                            <div className="flex h-dvh w-full flex-col bg-background">
                              <Sidebar />
                              <TopBar />
                              <DashboardMainContent>{children}</DashboardMainContent>
                              <FloatingAssistantButton />
                            </div>
                          </SidebarStateProvider>
                        </UserProfileSessionProvider>
                      </ImportantDatesSessionProvider>
                    </ContentWorkspaceProvider>
                  </CampaignsSessionProvider>
                </ThemesSessionProvider>
              </SettingsSessionProvider>
            </TeamSessionProvider>
          </BrandsSessionProvider>
        </AccountsSessionProvider>
      </PostsSessionProvider>
    </WorkspacePersistenceProvider>
  );
}
