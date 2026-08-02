import { NextResponse } from "next/server";
import { computeHolidays } from "@/lib/holidays/holidays-service";
import { validateHolidaysRequest } from "@/lib/holidays/validate-request";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Catalogue de congés calculé localement par date-holidays — aucun appel externe, aucune clé,
 * aucune écriture Supabase. Réservé aux utilisateurs authentifiés (comme le reste de l'API),
 * sans limite de requêtes dédiée : calcul pur en mémoire, mis en cache par pays/région/année. */

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ status: "error", code, message }, { status });
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorResponse("unauthorized", "Authentification requise.", 401);

  const url = new URL(request.url);
  const validation = validateHolidaysRequest(url.searchParams);
  if (!validation.valid) return errorResponse("invalid_request", validation.message, 400);
  const { countryCode, regionCode, year, locale } = validation.value;

  try {
    const holidays = computeHolidays(countryCode, regionCode, year, locale);
    return NextResponse.json({ status: "ok", holidays, countryCode, regionCode: regionCode ?? null, year, locale });
  } catch (error) {
    console.error("[calendrier/conges] erreur de calcul", { countryCode, regionCode, year, error });
    return errorResponse("computation_failed", "Impossible de calculer les congés pour ces paramètres.", 422);
  }
}
