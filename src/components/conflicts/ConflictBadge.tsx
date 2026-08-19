"use client";

import { useTranslations } from "@/lib/i18n/locale-provider";

interface ConflictBadgeProps {
  count: number;
  className?: string;
}

/** Badge compact réutilisé partout où un compte de conflits doit être signalé (F1.7) —
 * indicateur de synchronisation, navigation supérieure, menu Gestion, paramètres. */
export function ConflictBadge({ count, className }: ConflictBadgeProps) {
  const t = useTranslations();
  if (count <= 0) return null;
  return (
    <span
      aria-label={t("conflicts.badge.ariaLabel", { count, plural: count > 1 ? "s" : "" })}
      className={
        className ??
        "flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white"
      }
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
