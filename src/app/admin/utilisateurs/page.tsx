import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

async function getAdminData() {
  const supabase = createSupabaseServiceRoleClient();

  const [usersResult, workspacesResult, brandsResult] = await Promise.all([
    supabase.auth.admin.listUsers({ perPage: 200 }),
    supabase.from("workspaces").select("id, name, usage_type, onboarding_completed, created_at").order("created_at", { ascending: false }),
    supabase.from("brands").select("id, name, workspace_id, status, created_at").is("deleted_at", null).order("created_at", { ascending: false }),
  ]);

  return {
    users: usersResult.data?.users ?? [],
    workspaces: workspacesResult.data ?? [],
    brands: brandsResult.data ?? [],
  };
}

/** Vue de lecture simple — pas de CRM, pas d'action de gestion complexe. Utilise service_role
 * uniquement pour lire (jamais écrire) ces trois listes ; réservé à cette page admin déjà gardée
 * par isPlatformAdminEmail() au niveau du layout. */
export default async function AdminUsersPage() {
  const { users, workspaces, brands } = await getAdminData();
  const brandCountByWorkspace = new Map<string, number>();
  for (const brand of brands) {
    const key = brand.workspace_id as string;
    brandCountByWorkspace.set(key, (brandCountByWorkspace.get(key) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Utilisateurs & workspaces</h1>
        <p className="text-sm text-muted-foreground">Vue de lecture simple — aucune action de gestion complexe.</p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">Utilisateurs ({users.length})</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2">E-mail</th>
                <th className="px-4 py-2">Statut</th>
                <th className="px-4 py-2">Créé le</th>
                <th className="px-4 py-2">Dernière connexion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-2 text-foreground">{user.email}</td>
                  <td className="px-4 py-2 text-muted-foreground">{user.email_confirmed_at ? "Confirmé" : "En attente"}</td>
                  <td className="px-4 py-2 text-muted-foreground">{formatDate(user.created_at)}</td>
                  <td className="px-4 py-2 text-muted-foreground">{formatDate(user.last_sign_in_at)}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Aucun utilisateur.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">Workspaces ({workspaces.length})</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Nom</th>
                <th className="px-4 py-2">Usage</th>
                <th className="px-4 py-2">Onboarding</th>
                <th className="px-4 py-2">Marques</th>
                <th className="px-4 py-2">Créé le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {workspaces.map((workspace) => (
                <tr key={workspace.id as string}>
                  <td className="px-4 py-2 text-foreground">{(workspace.name as string) || "Sans nom"}</td>
                  <td className="px-4 py-2 text-muted-foreground">{(workspace.usage_type as string) || "—"}</td>
                  <td className="px-4 py-2 text-muted-foreground">{workspace.onboarding_completed ? "Terminé" : "En cours"}</td>
                  <td className="px-4 py-2 text-muted-foreground">{brandCountByWorkspace.get(workspace.id as string) ?? 0}</td>
                  <td className="px-4 py-2 text-muted-foreground">{formatDate(workspace.created_at as string)}</td>
                </tr>
              ))}
              {workspaces.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Aucun workspace.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">Marques ({brands.length})</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Nom</th>
                <th className="px-4 py-2">Statut</th>
                <th className="px-4 py-2">Créée le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {brands.map((brand) => (
                <tr key={brand.id as string}>
                  <td className="px-4 py-2 text-foreground">{brand.name as string}</td>
                  <td className="px-4 py-2 text-muted-foreground">{brand.status as string}</td>
                  <td className="px-4 py-2 text-muted-foreground">{formatDate(brand.created_at as string)}</td>
                </tr>
              ))}
              {brands.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">Aucune marque.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
