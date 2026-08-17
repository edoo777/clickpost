import { PromptOverrideEditor } from "@/components/admin/PromptOverrideEditor";
import { listPromptOverrides } from "@/lib/admin/prompt-overrides";

export default async function AdminPromptsPage() {
  const overrides = await listPromptOverrides();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Prompts IA</h1>
        <p className="text-sm text-muted-foreground">
          Un prompt administrable par fonction IA de ClickPost : nom, statut actif/inactif, note
          système (ajoutée au début) et instructions supplémentaires (ajoutées à la fin) —
          toujours en complément, jamais un remplacement des règles de sécurité codées en dur
          (anti-invention de données, format de réponse strict). Un prompt inactif ou absent
          retombe automatiquement sur le comportement standard. Une seule marche arrière
          disponible par prompt, sur les instructions supplémentaires.
        </p>
      </header>

      {overrides.map((override) => (
        <PromptOverrideEditor key={override.key} override={override} />
      ))}
    </div>
  );
}
