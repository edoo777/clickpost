"use client";

import { useBrandsSession } from "@/lib/brands-store";
import type { ApprovalFilters as ApprovalFiltersState } from "@/lib/approval";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type { TeamMember } from "@/types/team";

const FIELD_CLASS =
  "rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-zinc-700   dark:text-zinc-300";

interface ApprovalFiltersProps {
  value: ApprovalFiltersState;
  members: TeamMember[];
  onChange: (value: ApprovalFiltersState) => void;
}

export function ApprovalFilters({ value, members, onChange }: ApprovalFiltersProps) {
  const t = useTranslations();
  const { brands } = useBrandsSession();
  const activeMembers = members.filter((member) => member.status === "active");

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={value.brand}
        onChange={(event) => onChange({ ...value, brand: event.target.value })}
        className={FIELD_CLASS}
      >
        <option value="all">{t("dashboard.allBrands")}</option>
        {brands.map((brand) => (
          <option key={brand.id} value={brand.name}>
            {brand.name}
          </option>
        ))}
      </select>

      <select
        value={value.owner}
        onChange={(event) => onChange({ ...value, owner: event.target.value })}
        className={FIELD_CLASS}
      >
        <option value="all">{t("approvals.filters.allOwners")}</option>
        {activeMembers.map((member) => (
          <option key={member.id} value={member.name}>
            {member.name}
          </option>
        ))}
      </select>

      <select
        value={value.approver}
        onChange={(event) => onChange({ ...value, approver: event.target.value })}
        className={FIELD_CLASS}
      >
        <option value="all">{t("approvals.filters.allApprovers")}</option>
        {activeMembers.map((member) => (
          <option key={member.id} value={member.name}>
            {member.name}
          </option>
        ))}
      </select>

      <select
        value={value.status}
        onChange={(event) =>
          onChange({ ...value, status: event.target.value as ApprovalFiltersState["status"] })
        }
        className={FIELD_CLASS}
      >
        <option value="all">{t("approvals.filters.reviewAndPendingClient")}</option>
        <option value="in_review">{t("status.publication.in_review")}</option>
        <option value="pending_client">{t("status.publication.pending_client")}</option>
      </select>
    </div>
  );
}
