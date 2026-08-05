import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { linkedInProvider } from "@/lib/linkedin/provider";
import { mapRowToRecord } from "@/lib/sync/mappers";
import type { SocialAccount } from "@/types/dashboard";
import type { Publication } from "@/types/publication";
import type { PublishAttempt } from "@/types/publishing-provider";

/**
 * Planificateur réel de publication LinkedIn — traite en un seul passage toutes les publications
 * dues, tous workspaces confondus (clé service_role, hors RLS par conception, voir
 * service-role.ts). Conçu pour être appelé par un déclencheur externe sans état (Vercel Cron —
 * voir src/app/api/cron/linkedin-publish/route.ts et vercel.json) : aucune boucle locale
 * permanente, chaque exécution est indépendante et complète en elle-même.
 *
 * Verrouillage : chaque publication candidate est réclamée par une mise à jour conditionnelle
 * (`status = 'publishing' WHERE id = X AND status = <statut lu>`) — si aucune ligne n'est
 * modifiée, une autre exécution l'a déjà réclamée entre-temps, elle est ignorée sans double
 * traitement (même principe que la détection de conflit par révision déjà utilisée par le moteur
 * de synchronisation). Une publication restée en "publishing" plus de STUCK_THRESHOLD_MS
 * (exécution précédente interrompue, ex. timeout serverless) redevient éligible.
 *
 * Idempotence : chaque tentative automatique est journalisée dans `publishAttempts` avant toute
 * décision de statut — jamais une seconde publication du même contenu une fois qu'une tentative a
 * déjà réussi (linkedInProvider.publish() lui-même ne sait rien de l'idempotence : c'est
 * l'appelant, ici, qui ne réclame jamais une publication déjà `published`, par construction de la
 * requête candidate).
 */
const STUCK_PUBLISHING_THRESHOLD_MS = 10 * 60 * 1000;
const MAX_AUTOMATIC_ATTEMPTS = 3;
const SCHEDULER_ACTOR_NAME = "Planificateur automatique";

export interface SchedulerRunResult {
  candidates: number;
  claimed: number;
  published: number;
  retriedLater: number;
  failedPermanently: number;
  skippedAlreadyClaimed: number;
  errors: { publicationId: string; message: string }[];
}

type ServiceRoleClient = ReturnType<typeof createSupabaseServiceRoleClient>;
type Outcome = "published" | "retried_later" | "failed_permanently";

export async function processDueLinkedInPublications(now: Date = new Date()): Promise<SchedulerRunResult> {
  const supabase = createSupabaseServiceRoleClient();
  const result: SchedulerRunResult = {
    candidates: 0,
    claimed: 0,
    published: 0,
    retriedLater: 0,
    failedPermanently: 0,
    skippedAlreadyClaimed: 0,
    errors: [],
  };

  const stuckCutoff = new Date(now.getTime() - STUCK_PUBLISHING_THRESHOLD_MS).toISOString();

  const [{ data: scheduledDue, error: scheduledError }, { data: stuckPublishing, error: stuckError }] = await Promise.all([
    supabase
      .from("publications")
      .select("*")
      .eq("platform", "linkedin")
      .eq("status", "scheduled")
      .is("deleted_at", null)
      .lte("scheduled_for", now.toISOString()),
    supabase
      .from("publications")
      .select("*")
      .eq("platform", "linkedin")
      .eq("status", "publishing")
      .is("deleted_at", null)
      .lt("updated_at", stuckCutoff),
  ]);

  if (scheduledError || stuckError) {
    result.errors.push({
      publicationId: "n/a",
      message: `Lecture des publications dues impossible : ${(scheduledError ?? stuckError)?.message ?? "erreur inconnue"}`,
    });
    return result;
  }

  const candidateRows = [...(scheduledDue ?? []), ...(stuckPublishing ?? [])];
  result.candidates = candidateRows.length;

  for (const row of candidateRows) {
    const previousStatus = (row as { status: string }).status;
    const publicationId = (row as { id: string }).id;
    const workspaceId = (row as { workspace_id: string }).workspace_id;

    const { data: claimedRow, error: claimError } = await supabase
      .from("publications")
      .update({ status: "publishing", updated_at: now.toISOString() })
      .eq("id", publicationId)
      .eq("status", previousStatus)
      .select()
      .maybeSingle();

    if (claimError) {
      result.errors.push({ publicationId, message: claimError.message });
      continue;
    }
    if (!claimedRow) {
      result.skippedAlreadyClaimed++;
      continue;
    }
    result.claimed++;

    const publication = mapRowToRecord(claimedRow) as unknown as Publication;

    try {
      const outcome = await processOnePublication(supabase, publication, workspaceId, now);
      if (outcome === "published") result.published++;
      else if (outcome === "retried_later") result.retriedLater++;
      else result.failedPermanently++;
    } catch (error) {
      result.errors.push({ publicationId, message: error instanceof Error ? error.message : String(error) });
      // Ne jamais laisser une publication bloquée en "publishing" à cause d'une exception
      // inattendue — repasse "scheduled" pour qu'une prochaine exécution (ou le délai de
      // récupération ci-dessus si ce repli échoue aussi) puisse retenter proprement.
      await supabase.from("publications").update({ status: "scheduled" }).eq("id", publicationId).eq("status", "publishing");
    }
  }

  return result;
}

async function processOnePublication(
  supabase: ServiceRoleClient,
  publication: Publication,
  workspaceId: string,
  now: Date
): Promise<Outcome> {
  const { data: accountRow, error: accountError } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", publication.accountId)
    .maybeSingle();

  if (accountError || !accountRow) {
    return recordAttempt(supabase, publication, now, {
      status: "failed",
      errorMessage: "Compte LinkedIn introuvable.",
      isPermanent: true,
    });
  }
  const account = mapRowToRecord(accountRow) as unknown as SocialAccount;

  const automaticAttemptsSoFar = (publication.publishAttempts ?? []).filter((attempt) => attempt.mode === "automatic").length;
  const idempotencyKey = `${publication.id}:scheduler:${automaticAttemptsSoFar}`;

  const result = await linkedInProvider.publish({ publication, account, workspaceId, idempotencyKey });

  if (result.isPermissionError) {
    await supabase.from("accounts").update({ status: "insufficient_permission", last_checked_at: now.toISOString() }).eq("id", account.id);
  }

  return recordAttempt(supabase, publication, now, result, automaticAttemptsSoFar + 1);
}

async function recordAttempt(
  supabase: ServiceRoleClient,
  publication: Publication,
  now: Date,
  result: { status: "success" | "failed"; errorMessage?: string; externalPostId?: string; isPermanent?: boolean },
  attemptNumber = 1
): Promise<Outcome> {
  const attempt: PublishAttempt = {
    id: crypto.randomUUID(),
    mode: "automatic",
    status: result.status,
    actorName: SCHEDULER_ACTOR_NAME,
    createdAt: now.toISOString(),
    errorMessage: result.errorMessage,
    externalPostId: result.externalPostId,
  };
  const updatedAttempts = [...(publication.publishAttempts ?? []), attempt];

  if (result.status === "success") {
    await supabase
      .from("publications")
      .update({ status: "published", publish_attempts: updatedAttempts, updated_at: now.toISOString() })
      .eq("id", publication.id);
    return "published";
  }

  // Politique de nouvelle tentative : un échec non permanent redevient "scheduled" (donc à
  // nouveau candidat dès le prochain passage du planificateur — le rythme du déclencheur externe
  // fournit déjà un espacement naturel entre tentatives) jusqu'à MAX_AUTOMATIC_ATTEMPTS ; un échec
  // permanent, ou le nombre maximal de tentatives atteint, arrête définitivement les reprises
  // automatiques (jamais une boucle infinie), le mode manuel reste disponible ensuite.
  const exhausted = attemptNumber >= MAX_AUTOMATIC_ATTEMPTS;
  const isPermanent = Boolean(result.isPermanent) || exhausted;

  await supabase
    .from("publications")
    .update({ status: isPermanent ? "failed" : "scheduled", publish_attempts: updatedAttempts, updated_at: now.toISOString() })
    .eq("id", publication.id);

  return isPermanent ? "failed_permanently" : "retried_later";
}
