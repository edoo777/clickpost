import Link from "next/link";

export const metadata = { title: "Conditions d'utilisation — ClickPost" };

export default function ConditionsPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-4 px-6 py-16 text-foreground">
      <Link href="/bienvenue" className="w-fit text-sm text-muted-foreground hover:underline">
        ← Retour
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">Conditions d&apos;utilisation</h1>
      <p className="text-sm text-muted-foreground">
        ClickPost est actuellement proposé en accès bêta, à des fins de test. Le service peut
        évoluer, être temporairement interrompu, ou voir certaines fonctionnalités modifiées sans
        préavis pendant cette phase. Des conditions d&apos;utilisation complètes seront publiées
        avant l&apos;ouverture publique du service.
      </p>
      <p className="text-sm text-muted-foreground">
        En utilisant la bêta, vous acceptez que certaines fonctionnalités soient encore en
        développement et que des ajustements puissent être apportés à votre contenu de test.
        Aucune donnée réelle critique ne devrait être exclusivement conservée dans ClickPost
        pendant cette phase.
      </p>
    </div>
  );
}
