import Link from "next/link";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

async function getCounts() {
  const supabase = createSupabaseServiceRoleClient();
  const [profiles, workspaces, brands] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("workspaces").select("id", { count: "exact", head: true }),
    supabase.from("brands").select("id", { count: "exact", head: true }).is("deleted_at", null),
  ]);
  return {
    profiles: profiles.count ?? 0,
    workspaces: workspaces.count ?? 0,
    brands: brands.count ?? 0,
  };
}

const SECTIONS = [
  { href: "/admin/kpi", title: "Business & KPI", description: "Activité, entonnoir, usage IA et répartition par plan/réseau — données réelles uniquement." },
  { href: "/admin/prompts", title: "Prompts IA", description: "Compléments de prompt par fonction (Copilote, Atelier, Générateur, Rapports)." },
  { href: "/admin/textes", title: "Textes produit", description: "Onboarding, messages système — un ensemble curé, pas exhaustif." },
  { href: "/admin/utilisateurs", title: "Utilisateurs & workspaces", description: "Vue de lecture simple, aucune action de gestion complexe." },
  { href: "/admin/fonctionnalites", title: "Fonctionnalités", description: "Interrupteurs simples pour activer une fonctionnalité en préparation." },
];

export default async function AdminOverviewPage() {
  const counts = await getCounts();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Vue d&apos;ensemble</h1>
        <p className="text-sm text-muted-foreground">
          Espace réservé à l&apos;administrateur ClickPost — gérer les opérations courantes sans
          modifier le code.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-5">
          <span className="text-xs text-muted-foreground">Utilisateurs</span>
          <p className="text-2xl font-semibold text-foreground">{counts.profiles}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <span className="text-xs text-muted-foreground">Workspaces</span>
          <p className="text-2xl font-semibold text-foreground">{counts.workspaces}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <span className="text-xs text-muted-foreground">Marques actives</span>
          <p className="text-2xl font-semibold text-foreground">{counts.brands}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-5 transition-colors hover:border-violet-200 hover:bg-violet-50 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10"
          >
            <span className="text-sm font-semibold text-foreground">{section.title}</span>
            <span className="text-xs text-muted-foreground">{section.description}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
