import { PromptOverrideEditor } from "@/components/admin/PromptOverrideEditor";
import { listPromptOverrides } from "@/lib/admin/prompt-overrides";

export default async function AdminPromptsPage() {
  const overrides = await listPromptOverrides();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Prompts IA</h1>
        <p className="text-sm text-muted-foreground">
          Un complément par fonction, ajouté à la fin du prompt système existant — jamais un
          remplacement des règles de sécurité codées en dur (anti-invention de données, format de
          réponse strict). Une seule marche arrière disponible par prompt.
        </p>
      </header>

      {overrides.map((override) => (
        <PromptOverrideEditor key={override.key} override={override} />
      ))}
    </div>
  );
}
