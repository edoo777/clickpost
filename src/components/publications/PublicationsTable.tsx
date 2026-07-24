import Link from "next/link";
import { platformIcons } from "@/components/icons";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/post-status";
import type { Publication } from "@/types/publication";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

interface PublicationsTableProps {
  publications: Publication[];
}

export function PublicationsTable({ publications }: PublicationsTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-black/[.08] bg-white dark:border-white/[.08] dark:bg-zinc-950">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-black/[.06] text-xs font-medium text-zinc-400 dark:border-white/[.06] dark:text-zinc-600">
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Marque</th>
            <th className="px-4 py-3">Réseau</th>
            <th className="px-4 py-3">Thématique</th>
            <th className="px-4 py-3">Statut</th>
            <th className="px-4 py-3">Responsable</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/[.06] dark:divide-white/[.06]">
          {publications.map((publication) => {
            const Icon = platformIcons[publication.platform];
            return (
              <tr key={publication.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                  <Link href={`/publications/${publication.id}`} className="block hover:underline">
                    {dateFormatter.format(new Date(publication.scheduledFor))}
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                  <Link href={`/publications/${publication.id}`}>{publication.brand}</Link>
                </td>
                <td className="px-4 py-3">
                  <Icon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                </td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                  {publication.theme || "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[publication.status]}`}
                  >
                    {STATUS_LABEL[publication.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                  {publication.owner || "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
