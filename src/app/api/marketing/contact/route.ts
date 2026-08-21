import { NextResponse } from "next/server";
import { checkContactRateLimit } from "@/lib/marketing/contact-rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ status: "error", code, message }, { status });
}

const MAX_FIELD_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 5000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_PERSONAS = ["creator", "entrepreneur", "agency", "marketingTeam", "other"];

/**
 * Formulaire de contact public (`/contact`) — jamais un succès simulé : chaque soumission est
 * réellement écrite dans `contact_submissions` (voir la migration associée) avant de renvoyer
 * "ok". Aucune authentification requise (route publique), donc limitation de débit par IP plutôt
 * que par utilisateur (voir contact-rate-limit.ts) et validation stricte des champs — seule ligne
 * de défense contre les abus pour une route ouverte à tous.
 */
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateLimit = checkContactRateLimit(ip);
  if (!rateLimit.allowed) {
    return errorResponse("rate_limited", "Trop de messages envoyés récemment — merci de réessayer plus tard.", 429);
  }

  const body = (await request.json().catch(() => null)) as
    | { name?: unknown; email?: unknown; company?: unknown; persona?: unknown; message?: unknown }
    | null;
  if (!body) return errorResponse("invalid_request", "Requête invalide.", 400);

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const company = typeof body.company === "string" ? body.company.trim() : "";
  const persona = typeof body.persona === "string" ? body.persona.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!name || name.length > MAX_FIELD_LENGTH) return errorResponse("invalid_name", "Nom requis.", 400);
  if (!EMAIL_PATTERN.test(email) || email.length > MAX_FIELD_LENGTH) return errorResponse("invalid_email", "Adresse email invalide.", 400);
  if (company.length > MAX_FIELD_LENGTH) return errorResponse("invalid_company", "Nom d'entreprise trop long.", 400);
  if (persona && !VALID_PERSONAS.includes(persona)) return errorResponse("invalid_persona", "Valeur invalide.", 400);
  if (!message || message.length > MAX_MESSAGE_LENGTH) return errorResponse("invalid_message", "Message requis.", 400);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("contact_submissions").insert({
    name,
    email,
    company: company || null,
    persona: persona || null,
    message,
  });

  if (error) return errorResponse("storage_error", "Envoi impossible pour le moment — merci de réessayer.", 500);

  return NextResponse.json({ status: "ok" });
}
