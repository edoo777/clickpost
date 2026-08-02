import type { DragEvent } from "react";
import { HolidayBadge } from "@/components/calendar/HolidayBadge";
import { PostChip } from "@/components/calendar/PostChip";
import type { HolidayEvent } from "@/types/holiday";
import type { Publication } from "@/types/publication";

const MAX_VISIBLE = 3;

interface DayCellProps {
  day: number | null;
  isToday: boolean;
  posts: Publication[];
  onSelectPost: (post: Publication) => void;
  /** Glisser-déposer pour replanifier — optionnel, ajouté pour la vue Calendrier des Publications
   * sans changer le comportement de l'aperçu tableau de bord qui ne les fournit pas. */
  draggable?: boolean;
  isDropTarget?: boolean;
  onDragOver?: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (event: DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: DragEvent<HTMLDivElement>) => void;
  onCreateEmpty?: () => void;
  /** Congés à afficher ce jour — optionnel, fourni uniquement par la page /calendrier dédiée
   * (jamais par la vue Calendrier intégrée dans Publications, qui ne passe pas cette prop). */
  holidays?: HolidayEvent[];
  onSelectHoliday?: (holiday: HolidayEvent) => void;
}

export function DayCell({
  day,
  isToday,
  posts,
  onSelectPost,
  draggable,
  isDropTarget,
  onDragOver,
  onDragLeave,
  onDrop,
  onCreateEmpty,
  holidays,
  onSelectHoliday,
}: DayCellProps) {
  if (day === null) {
    return <div className="min-h-[6.5rem] rounded-lg" />;
  }

  const visible = posts.slice(0, MAX_VISIBLE);
  const overflow = posts.length - visible.length;

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`group relative flex min-h-[6.5rem] flex-col gap-1 rounded-lg p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 ${
        isDropTarget ? "bg-violet-50 ring-1 ring-violet-400 dark:bg-violet-500/10" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
            isToday
              ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm shadow-fuchsia-500/20"
              : "text-muted-foreground "
          }`}
        >
          {day}
        </span>
        {onCreateEmpty && (
          <button
            type="button"
            onClick={onCreateEmpty}
            aria-label={`Créer une publication ce jour (${day})`}
            className="hidden h-5 w-5 items-center justify-center rounded-full text-sm font-semibold text-muted-foreground hover:bg-violet-100 hover:text-violet-700 group-hover:flex dark:hover:bg-violet-500/20 dark:hover:text-violet-300"
          >
            +
          </button>
        )}
      </div>
      <div className="flex flex-col gap-1">
        {holidays?.map((holiday) => (
          <HolidayBadge key={holiday.id} holiday={holiday} onClick={() => onSelectHoliday?.(holiday)} />
        ))}
        {visible.map((post) => (
          <PostChip
            key={post.id}
            post={post}
            onClick={() => onSelectPost(post)}
            draggable={draggable}
            onDragStart={(event) => {
              event.dataTransfer.setData("text/plain", post.id);
              event.dataTransfer.effectAllowed = "move";
            }}
          />
        ))}
        {overflow > 0 && (
          <span className="px-1.5 text-xs font-medium text-muted-foreground ">
            +{overflow} de plus
          </span>
        )}
      </div>
    </div>
  );
}
