import { NextResponse } from "next/server";
import { safeEqual } from "@/lib/oauth/token-encryption";
import { processDueLinkedInPublications } from "@/lib/linkedin/scheduler";

/**
 * Déclencheur du planificateur LinkedIn réel — voir docs/linkedin-test-integration.md, section
 * Planificateur. Appelé par Vercel Cron en production (vercel.json), ou manuellement en local
 * pour les tests (voir la commande curl documentée). Authentification par CRON_SECRET
 * uniquement — jamais une session utilisateur (voir l'exemption dans proxy.ts) : ce n'est pas une
 * action déclenchée par un membre du workspace, mais une tâche de fond transverse à tous les
 * workspaces (clé service_role).
 */
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // jamais autoriser un déclenchement si aucun secret n'est configuré.
  const header = request.headers.get("authorization");
  if (!header) return false;
  // Comparaison à temps constant, cohérente avec le reste du code (voir token-encryption.ts) —
  // un `===` naïf sur un secret est un canal auxiliaire par mesure de temps, même si le risque
  // pratique reste faible ici face à la latence réseau.
  return safeEqual(header, `Bearer ${secret}`);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ status: "error", message: "Non autorisé." }, { status: 401 });
  }
  const result = await processDueLinkedInPublications();
  return NextResponse.json({ status: "ok", result });
}

export async function POST(request: Request) {
  return GET(request);
}
