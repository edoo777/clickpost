import { NOTIFICATION_LABEL } from "@/lib/settings-data";
import type { NotificationKey } from "@/types/settings";

const NOTIFICATION_ORDER: NotificationKey[] = [
  "new_to_review",
  "change_requests",
  "approvals_received",
  "expired_connections",
  "publish_failures",
  "weekly_summary",
];

interface NotificationsSectionProps {
  notifications: Record<NotificationKey, boolean>;
  editable: boolean;
  onChange: (notifications: Record<NotificationKey, boolean>) => void;
}

export function NotificationsSection({ notifications, editable, onChange }: NotificationsSectionProps) {
  function toggle(key: NotificationKey) {
    if (!editable) return;
    onChange({ ...notifications, [key]: !notifications[key] });
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5  ">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-foreground ">Notifications</h2>
        <p className="text-xs text-muted-foreground ">
          Simulation — aucune notification réelle n&apos;est envoyée.
        </p>
      </div>

      <div className="flex flex-col divide-y divide-border ">
        {NOTIFICATION_ORDER.map((key) => (
          <label
            key={key}
            className="flex items-center justify-between gap-3 py-2.5 text-sm font-medium text-zinc-700 first:pt-0 last:pb-0 dark:text-zinc-300"
          >
            {NOTIFICATION_LABEL[key]}
            <button
              type="button"
              disabled={!editable}
              onClick={() => toggle(key)}
              aria-label={notifications[key] ? "Désactiver" : "Activer"}
              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                notifications[key] ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
              } ${editable ? "cursor-pointer" : "cursor-default"}`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  notifications[key] ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
          </label>
        ))}
      </div>
    </section>
  );
}
