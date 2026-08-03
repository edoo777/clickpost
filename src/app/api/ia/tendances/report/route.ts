import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * « Signaler une information incorrecte » — MVP : journalisation serveur uniquement, jamais
 * persistée dans Supabase (aucune table dédiée n'a été demandée pour ce MVP, donc aucune
 * migration créée pour ce seul besoin — limite documentée dans le rapport de livraison). Jamais
 * de contenu potentiellement sensible dans les journaux, uniquement des identifiants.
 */

function boundedText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, maxLength) : undefined;
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ status: "error", message: "Authentification requise." }, { status: 401 });

  const rawBody = await request.json().catch(() => null);
  const record = (rawBody as Record<string, unknown>) ?? {};
  const itemId = boundedText(record.itemId, 200);
  const sourceUrl = boundedText(record.sourceUrl, 500);
  const reason = boundedText(record.reason, 500);

  if (!itemId || !sourceUrl) {
    return NextResponse.json({ status: "error", message: "Identifiant et source requis." }, { status: 400 });
  }

  console.warn("[ia/tendances/report] signalement reçu", { userId: user.id, itemId, sourceUrl, reason });

  return NextResponse.json({ status: "ok" });
}
