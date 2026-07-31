import type { DragEvent } from "react";
import { platformColors } from "@/lib/platform-colors";
import type { Publication } from "@/types/publication";

interface PostChipProps {
  post: Publication;
  onClick: () => void;
  draggable?: boolean;
  onDragStart?: (event: DragEvent<HTMLButtonElement>) => void;
}

export function PostChip({ post, onClick, draggable, onDragStart }: PostChipProps) {
  const color = platformColors[post.platform];

  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
      className={`flex w-full items-center gap-1.5 truncate rounded-md border px-1.5 py-1 text-left text-xs font-medium ${color.bg} ${color.text} ${color.border} ${draggable ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${color.dot}`} />
      <span className="truncate">{post.excerpt}</span>
    </button>
  );
}
