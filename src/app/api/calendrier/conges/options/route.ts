import { NextResponse } from "next/server";
import { getSupportedCountries, getSupportedRegions } from "@/lib/holidays/holidays-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const COUNTRY_PATTERN = /^[A-Za-z]{2}$/;
const LOCALE_PATTERN = /^[a-z]{2}$/;

/** Liste des pays/régions réellement supportés par date-holidays — jamais une liste écrite à la
 * main, toujours dérivée de la bibliothèque elle-même. */
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ status: "error", code: "unauthorized", message: "Authentification requise." }, { status: 401 });

  const url = new URL(request.url);
  const localeRaw = url.searchParams.get("locale") ?? "fr";
  const locale = LOCALE_PATTERN.test(localeRaw) ? localeRaw.toLowerCase() : "fr";

  const countryRaw = url.searchParams.get("countryCode");
  const countryCode = countryRaw && COUNTRY_PATTERN.test(countryRaw) ? countryRaw.toUpperCase() : null;

  const countries = getSupportedCountries(locale);
  const regions = countryCode ? getSupportedRegions(countryCode, locale) : [];

  return NextResponse.json({ status: "ok", countries, regions });
}
