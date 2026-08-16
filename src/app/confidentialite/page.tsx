import Link from "next/link";

export const metadata = { title: "Confidentialité — ClickPost" };

export default function ConfidentialitePage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-4 px-6 py-16 text-foreground">
      <Link href="/bienvenue" className="w-fit text-sm text-muted-foreground hover:underline">
        ← Retour
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">Confidentialité</h1>
      <p className="text-sm text-muted-foreground">
        ClickPost est actuellement en phase bêta. Une politique de confidentialité complète sera
        publiée avant l&apos;ouverture publique du service. Pour toute question sur le traitement
        de vos données pendant la bêta, contactez directement l&apos;équipe ClickPost.
      </p>
      <p className="text-sm text-muted-foreground">
        En résumé dès aujourd&apos;hui : vos données restent isolées par workspace, les secrets
        (clés API, jetons de connexion) ne sont jamais exposés côté navigateur, et aucune donnée
        n&apos;est partagée avec un tiers en dehors des fournisseurs strictement nécessaires au
        fonctionnement du service (hébergement, base de données, IA générative).
      </p>
    </div>
  );
}
