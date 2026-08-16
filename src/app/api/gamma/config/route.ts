import { NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/admin/feature-flags";
import { isGammaConfigured } from "@/lib/gamma/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Expose uniquement un booléen (jamais la clé elle-même) — nécessaire pour que l'interface sache
 * afficher « Générer PDF » ou « Export PDF Gamma non configuré » sans jamais exposer de secret.
 * Double condition : la clé serveur ET l'interrupteur admin "gamma_pdf_export" doivent être
 * actifs — permet à l'administrateur de garder Gamma désactivé même une fois la clé configurée,
 * pour un déploiement progressif contrôlé depuis /admin plutôt que par une variable d'env seule. */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ status: "error", code: "unauthorized", message: "Authentification requise." }, { status: 401 });
  }

  const configured = isGammaConfigured() && (await isFeatureEnabled("gamma_pdf_export"));
  return NextResponse.json({ status: "ok", configured });
}
