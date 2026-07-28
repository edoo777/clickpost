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
    <div className="overflow-x-auto rounded-xl border border-border bg-surface  ">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-medium text-muted-foreground  ">
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Marque</th>
            <th className="px-4 py-3">Réseau</th>
            <th className="px-4 py-3">Thématique</th>
            <th className="px-4 py-3">Statut</th>
            <th className="px-4 py-3">Responsable</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border ">
          {publications.map((publication) => {
            const Icon = platformIcons[publication.platform];
            return (
              <tr key={publication.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                <td className="px-4 py-3 text-muted-foreground ">
                  <Link href={`/publications/${publication.id}`} className="block hover:underline">
                    {dateFormatter.format(new Date(publication.scheduledFor))}
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                  <Link href={`/publications/${publication.id}`}>{publication.brand}</Link>
                </td>
                <td className="px-4 py-3">
                  <Icon className="h-4 w-4 text-muted-foreground " />
                </td>
                <td className="px-4 py-3 text-muted-foreground ">
                  {publication.theme || "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[publication.status]}`}
                  >
                    {STATUS_LABEL[publication.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground ">
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
