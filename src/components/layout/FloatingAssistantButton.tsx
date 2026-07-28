"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconWand } from "@/components/icons";

export function FloatingAssistantButton() {
  const pathname = usePathname();
  if (pathname === "/assistant-ia" || pathname.startsWith("/assistant-ia/")) return null;

  return (
    <Link
      href="/assistant-ia"
      aria-label="Ouvrir l'Assistant IA"
      className="accent-halo group fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 py-3 pl-3 pr-3 text-white shadow-lg shadow-fuchsia-500/30 transition-all hover:pr-5 hover:shadow-fuchsia-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 focus-visible:ring-offset-2"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center">
        <IconWand className="h-5 w-5" />
      </span>
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold opacity-0 transition-all duration-200 group-hover:max-w-[140px] group-hover:opacity-100">
        Assistant IA
      </span>
    </Link>
  );
}
