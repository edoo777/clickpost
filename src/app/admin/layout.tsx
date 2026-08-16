import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { isPlatformAdminEmail } from "@/lib/admin/is-platform-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ADMIN_NAV = [
  { href: "/admin", label: "Vue d'ensemble" },
  { href: "/admin/prompts", label: "Prompts IA" },
  { href: "/admin/textes", label: "Textes produit" },
  { href: "/admin/utilisateurs", label: "Utilisateurs & workspaces" },
  { href: "/admin/fonctionnalites", label: "Fonctionnalités" },
];

/**
 * Deuxième vérification serveur, indépendante du middleware (défense en profondeur — voir
 * src/proxy.ts) : jamais un rôle de workspace, une liste d'e-mails serveur uniquement
 * (ADMIN_EMAILS, voir is-platform-admin.ts). Redirige silencieusement vers "/" si l'utilisateur
 * courant n'y figure pas, exactement comme le ferait un visiteur non concerné par cet espace.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isPlatformAdminEmail(user?.email)) {
    redirect("/");
  }

  return (
    <div className="flex min-h-dvh w-full flex-col bg-background">
      <header className="border-b border-border bg-surface px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-sm font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
              ClickPost Admin
            </span>
            <span className="text-xs text-muted-foreground">Connecté en tant que {user?.email}</span>
          </div>
          <Link href="/" className="text-xs font-medium text-muted-foreground hover:underline">
            ← Retour à l&apos;application
          </Link>
        </div>
        <nav className="mt-4 flex flex-wrap gap-1.5">
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-violet-50 hover:text-violet-700 dark:text-zinc-400 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">{children}</div>
      </main>
    </div>
  );
}
