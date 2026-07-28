import { STATUS_LABEL } from "@/lib/post-status";
import type { PublicationStatus } from "@/types/publication";
import type { ApprovalWorkflowSettings } from "@/types/settings";
import type { TeamMember } from "@/types/team";

const INITIAL_STATUS_OPTIONS: PublicationStatus[] = ["idea", "draft"];

const INPUT_CLASS =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 disabled:bg-zinc-50 disabled:text-zinc-500 dark:border-white/[.08] dark:bg-zinc-950 dark:text-zinc-200 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-500";

interface WorkflowSectionProps {
  workflow: ApprovalWorkflowSettings;
  members: TeamMember[];
  editable: boolean;
  onChange: (workflow: ApprovalWorkflowSettings) => void;
}

export function WorkflowSection({ workflow, members, editable, onChange }: WorkflowSectionProps) {
  function set<K extends keyof ApprovalWorkflowSettings>(key: K, value: ApprovalWorkflowSettings[K]) {
    onChange({ ...workflow, [key]: value });
  }

  const activeMembers = members.filter((member) => member.status === "active");
  const stepsCount = (workflow.internalApprovalRequired ? 1 : 0) + (workflow.clientApprovalRequired ? 1 : 0);

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-white/[.08] dark:bg-zinc-950">
      <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Processus de travail</h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Statut initial d&apos;une publication
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
          Comportement après approbation
          <select
            disabled={!editable}
            value={workflow.postApprovalBehavior}
            onChange={(event) =>
              set("postApprovalBehavior", event.target.value as ApprovalWorkflowSettings["postApprovalBehavior"])
            }
            className={INPUT_CLASS}
          >
            <option value="ready_to_schedule">Prêt à programmer</option>
            <option value="scheduled">Programmé automatiquement</option>
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
          Approbation interne obligatoire
        </label>

        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            disabled={!editable}
            checked={workflow.clientApprovalRequired}
            onChange={(event) => set("clientApprovalRequired", event.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 dark:border-white/[.2]"
          />
          Approbation client obligatoire
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Responsable par défaut
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
          Approbateur par défaut
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

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {"Étapes du processus d'approbation : "}
        <span className="font-medium text-zinc-700 dark:text-zinc-300">{stepsCount}</span>
        {" (calculé à partir des cases ci-dessus)"}
      </p>
    </section>
  );
}
