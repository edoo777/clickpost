"use client";

import { useTranslations } from "@/lib/i18n/locale-provider";
import { useStatusLabel } from "@/lib/post-status";
import type { PublicationStatus } from "@/types/publication";
import type { ApprovalWorkflowSettings } from "@/types/settings";
import type { TeamMember } from "@/types/team";

const INITIAL_STATUS_OPTIONS: PublicationStatus[] = ["idea", "draft"];

const INPUT_CLASS =
  "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-zinc-800 disabled:bg-background disabled:text-zinc-500   dark:text-zinc-200 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-500";

interface WorkflowSectionProps {
  workflow: ApprovalWorkflowSettings;
  members: TeamMember[];
  editable: boolean;
  onChange: (workflow: ApprovalWorkflowSettings) => void;
}

export function WorkflowSection({ workflow, members, editable, onChange }: WorkflowSectionProps) {
  const t = useTranslations();
  const STATUS_LABEL = useStatusLabel();
  function set<K extends keyof ApprovalWorkflowSettings>(key: K, value: ApprovalWorkflowSettings[K]) {
    onChange({ ...workflow, [key]: value });
  }

  const activeMembers = members.filter((member) => member.status === "active");
  const stepsCount = (workflow.internalApprovalRequired ? 1 : 0) + (workflow.clientApprovalRequired ? 1 : 0);

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5  ">
      <h2 className="text-sm font-semibold text-foreground ">{t("settings.workflow.title")}</h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t("settings.workflow.initialStatusLabel")}
          <select
            disabled={!editable}
            value={workflow.initialStatus}
            onChange={(event) => set("initialStatus", event.target.value as PublicationStatus)}
            className={INPUT_CLASS}
          >
            {INITIAL_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABEL[status]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t("settings.workflow.postApprovalBehaviorLabel")}
          <select
            disabled={!editable}
            value={workflow.postApprovalBehavior}
            onChange={(event) =>
              set("postApprovalBehavior", event.target.value as ApprovalWorkflowSettings["postApprovalBehavior"])
            }
            className={INPUT_CLASS}
          >
            <option value="ready_to_schedule">{t("settings.workflow.postApprovalReadyOption")}</option>
            <option value="scheduled">{t("settings.workflow.postApprovalScheduledOption")}</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            disabled={!editable}
            checked={workflow.internalApprovalRequired}
            onChange={(event) => set("internalApprovalRequired", event.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 dark:border-white/[.2]"
          />
          {t("settings.workflow.internalApprovalLabel")}
        </label>

        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            disabled={!editable}
            checked={workflow.clientApprovalRequired}
            onChange={(event) => set("clientApprovalRequired", event.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 dark:border-white/[.2]"
          />
          {t("settings.workflow.clientApprovalLabel")}
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t("settings.workflow.defaultOwnerLabel")}
          <select
            disabled={!editable}
            value={workflow.defaultOwnerId}
            onChange={(event) => set("defaultOwnerId", event.target.value)}
            className={INPUT_CLASS}
          >
            {activeMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t("settings.workflow.defaultApproverLabel")}
          <select
            disabled={!editable}
            value={workflow.defaultApproverId}
            onChange={(event) => set("defaultApproverId", event.target.value)}
            className={INPUT_CLASS}
          >
            {activeMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-xs text-muted-foreground ">
        {t("settings.workflow.stepsCountPrefix")}
        <span className="font-medium text-zinc-700 dark:text-zinc-300">{stepsCount}</span>
        {t("settings.workflow.stepsCountSuffix")}
      </p>
    </section>
  );
}
