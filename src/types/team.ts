export type TeamRole = "owner" | "admin" | "manager" | "creator" | "reviewer" | "client_approver";

export type MemberStatus = "active" | "inactive";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: MemberStatus;
  brands: string[];
}
