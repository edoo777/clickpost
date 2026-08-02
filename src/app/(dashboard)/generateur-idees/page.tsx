import { redirect } from "next/navigation";

/** Ancienne route d'accès direct au Générateur d'idées — conservée pour les liens existants,
 * redirige vers le point d'entrée unique /boite-idees (onglet Générateur). Ne pas supprimer
 * sans avoir vérifié qu'aucune référence externe (favoris, liens partagés) ne la vise plus. */
export default function TopicGeneratorPage() {
  redirect("/boite-idees?tab=generateur");
}
