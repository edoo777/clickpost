export type UsageType = "solo" | "team" | "agency";
export type BrandingRadius = "none" | "sm" | "md" | "lg" | "xl" | "full";
export type BrandingThemeMode = "light" | "dark" | "system";

export interface ProfileRow {
  id: string;
  first_name: string;
  last_name: string;
  display_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
  company: string;
  time_zone: string;
  language: string;
  country: string;
  phone: string;
  bio: string;
  notifications: Record<string, boolean>;
  display_density: "comfortable" | "compact";
  active_workspace_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceRow {
  id: string;
  name: string;
  created_by: string;
  usage_type: UsageType | null;
  company_name: string | null;
  industry: string | null;
  social_platforms: string[];
  content_goals: string[];
  onboarding_step: number;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceBrandingRow {
  workspace_id: string;
  logo_url: string | null;
  favicon_url: string | null;
  color_primary: string;
  color_secondary: string;
  color_accent: string;
  color_sidebar: string;
  color_button: string;
  color_link: string;
  font_heading: string;
  font_body: string;
  radius: BrandingRadius;
  default_theme_mode: BrandingThemeMode;
  updated_at: string;
}

export const CLICKPOST_DEFAULT_BRANDING: Omit<WorkspaceBrandingRow, "workspace_id" | "updated_at"> = {
  logo_url: null,
  favicon_url: null,
  color_primary: "#7c3aed",
  color_secondary: "#c026d3",
  color_accent: "#ec4899",
  color_sidebar: "#0e0a1a",
  color_button: "#7c3aed",
  color_link: "#7c3aed",
  font_heading: "Inter",
  font_body: "Inter",
  radius: "lg",
  default_theme_mode: "system",
};
