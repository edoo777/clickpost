import { NextResponse } from "next/server";
import { linkedInProvider } from "@/lib/linkedin/provider";
import { mapRowToRecord } from "@/lib/sync/mappers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SocialAccount } from "@/types/dashboard";
import type { PublishAttempt } from "@/types/publishing-provider";
import type { Publication } from "@/types/publication";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ status: "error", code, message }, { status });
}

/**
 * Déclenchement d'une publication LinkedIn réelle — jamais appelée automatiquement (aucun
 * planificateur en tâche de fond n'existe encore dans ce projet, voir docs/linkedin-test-
 * integration.md) : uniquement sur action explicite (bouton « Publier via LinkedIn ») pour ce
 * premier test, ou plus tard par un vrai job de programmation qui appellerait cette même logique.
 *
 * Idempotence : refuse de publier une publication déjà marquée "published" ou déjà porteuse
 * d'une tentative "success" dans son historique — empêche une double publication même si la
 * requête est rejouée (double clic, nouvelle tentative après une coupure réseau côté client alors
 * que la précédente avait déjà réussi côté serveur).
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorResponse("unauthorized", "Authentification requise.", 401);

  const rawBody = await request.json().catch(() => null);
  const publicationId = (rawBody as { publicationId?: unknown } | null)?.publicationId;
  if (typeof publicationId !== "string" || publicationId.length === 0) {
    return errorResponse("invalid_request", "Identifiant de publication requis.", 400);
  }

  const { data: publicationRow, error: publicationError } = await supabase.from("publications").select("*").eq("id", publicationId).single();
  if (publicationError || !publicationRow) return errorResponse("not_found", "Publication introuvable ou inaccessible.", 404);
  const publication = mapRowToRecord(publicationRow) as unknown as Publication;
  const workspaceId = (publicationRow as { workspace_id: string }).workspace_id;

  if (publication.platform !== "linkedin") {
    return errorResponse("invalid_request", "Cette publication ne cible pas LinkedIn.", 400);
  }
  if (publication.status === "published" || (publication.publishAttempts ?? []).some((attempt) => attempt.status === "success")) {
    return errorResponse("already_published", "Cette publication a déjà été publiée avec succès — aucune nouvelle tentative envoyée.", 409);
  }

  const { data: accountRow, error: accountError } = await supabase.from("accounts").select("*").eq("id", publication.accountId).single();
  if (accountError || !accountRow) return errorResponse("account_not_found", "Compte LinkedIn introuvable ou inaccessible.", 404);
  const account = mapRowToRecord(accountRow) as unknown as SocialAccount;

  const attemptId = crypto.randomUUID();
  const now = new Date().toISOString();

  const result = await linkedInProvider.publish({
    publication,
    account,
    workspaceId,
    idempotencyKey: `${publication.id}:${attemptId}`,
  });

  const attempt: PublishAttempt = {
    id: attemptId,
    mode: "automatic",
    status: result.status,
    actorName: user.email ?? "Utilisateur",
    createdAt: now,
    errorMessage: result.errorMessage,
    externalPostId: result.externalPostId,
  };

  const updatedAttempts = [...(publication.publishAttempts ?? []), attempt];
  const nextStatus = result.status === "success" ? "published" : publication.status;

  const { error: updateError } = await supabase
    .from("publications")
    .update({ status: nextStatus, publish_attempts: updatedAttempts, updated_at: now })
    .eq("id", publicationId);
  if (updateError) return errorResponse("update_failed", "Publication tentée mais l'enregistrement local a échoué.", 500);

  if (result.isPermissionError && account.status !== "insufficient_permission") {
    await supabase.from("accounts").update({ status: "insufficient_permission", last_checked_at: now }).eq("id", account.id);
  }

  if (result.status === "success") {
    return NextResponse.json({ status: "ok", attempt, externalPostId: result.externalPostId });
  }
  return NextResponse.json(
    {
      status: "error",
      code: "publish_failed",
      message: result.errorMessage ?? "Échec de la publication LinkedIn.",
      attempt,
      isPermanent: Boolean(result.isPermanent),
      isPermissionError: Boolean(result.isPermissionError),
    },
    { status: result.isPermanent ? 422 : 502 }
  );
}
