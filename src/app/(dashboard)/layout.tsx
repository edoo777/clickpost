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
import { IdeaNotesSessionProvider } from "@/lib/idea-notes-store";
import { ImportantDatesSessionProvider } from "@/lib/important-dates-store";
import { ImportedMetricsSessionProvider } from "@/lib/imported-metrics-store";
import { PostsSessionProvider } from "@/lib/posts-store";
import { SavedTrendsSessionProvider } from "@/lib/saved-trends-store";
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
                      <IdeaNotesSessionProvider>
                        <ImportantDatesSessionProvider>
                          <SavedTrendsSessionProvider>
                            <ImportedMetricsSessionProvider>
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
                            </ImportedMetricsSessionProvider>
                          </SavedTrendsSessionProvider>
                        </ImportantDatesSessionProvider>
                      </IdeaNotesSessionProvider>
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
