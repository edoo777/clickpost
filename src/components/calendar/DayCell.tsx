import { PostChip } from "@/components/calendar/PostChip";
import type { Publication } from "@/types/publication";

const MAX_VISIBLE = 3;

interface DayCellProps {
  day: number | null;
  isToday: boolean;
  posts: Publication[];
  onSelectPost: (post: Publication) => void;
}

export function DayCell({ day, isToday, posts, onSelectPost }: DayCellProps) {
  if (day === null) {
    return <div className="min-h-[6.5rem] rounded-lg" />;
  }

  const visible = posts.slice(0, MAX_VISIBLE);
  const overflow = posts.length - visible.length;

  return (
    <div className="flex min-h-[6.5rem] flex-col gap-1 rounded-lg p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
          isToday
            ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm shadow-fuchsia-500/20"
            : "text-zinc-500 dark:text-zinc-400"
        }`}
      >
        {day}
      </span>
      <div className="flex flex-col gap-1">
        {visible.map((post) => (
          <PostChip key={post.id} post={post} onClick={() => onSelectPost(post)} />
        ))}
        {overflow > 0 && (
          <span className="px-1.5 text-xs font-medium text-zinc-400 dark:text-zinc-600">
            +{overflow} de plus
          </span>
        )}
      </div>
    </div>
  );
}
