import { redirect } from "next/navigation";

/** Ancienne route d'accès direct à la Banque d'idées — conservée pour les liens existants,
 * redirige vers le point d'entrée unique /boite-idees (onglet Banque). Ne pas supprimer
 * sans avoir vérifié qu'aucune référence externe (favoris, liens partagés) ne la vise plus. */
export default function IdeasBankPage() {
  redirect("/boite-idees?tab=banque");
}
