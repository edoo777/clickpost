import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import {
  IconBriefcase,
  IconCalendar,
  IconChartBar,
  IconClipboardCheck,
  IconLightbulb,
  IconLinkedin,
  IconLogoMark,
  IconSend,
  IconSparkles,
  IconTrendingUp,
  IconUsers,
  IconWand,
} from "@/components/icons";

export const metadata = {
  title: "ClickPost — Stratégie, contenu IA et publication social media",
  description:
    "ClickPost centralise la stratégie éditoriale, la génération de contenu par IA, la planification, la publication et les rapports de performance, pour une ou plusieurs marques.",
};

function Icon({ as: As, className }: { as: ComponentType<SVGProps<SVGSVGElement>>; className?: string }) {
  return <As className={className} />;
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
      {children}
    </span>
  );
}

const AUDIENCES = [
  {
    icon: IconLightbulb,
    title: "Créateurs de contenu",
    description: "Gérez sujets, rédaction et calendrier dans un seul endroit, sans jongler entre outils.",
  },
  {
    icon: IconBriefcase,
    title: "Agences marketing",
    description: "Plusieurs marques, plusieurs comptes, un rapport client clair à chaque fin de mois.",
  },
  {
    icon: IconUsers,
    title: "Équipes marketing internes",
    description: "Alignez stratégie, approbation et publication dans un seul flux de travail partagé.",
  },
  {
    icon: IconClipboardCheck,
    title: "Approbateurs clients",
    description: "Validez ou demandez des retouches sur chaque contenu avant sa publication, en un clic.",
  },
];

const PROBLEMS = [
  "Manque d'idées et de constance éditoriale d'une semaine à l'autre",
  "Contenu dispersé entre documents, tableurs et outils de design",
  "Difficulté à planifier et à visualiser plusieurs semaines à l'avance",
  "Trop d'outils différents pour un seul travail cohérent",
  "Impossible de démontrer simplement ce qui a été fait et ce que ça a produit",
];

const SOLUTION_ITEMS = [
  { icon: IconTrendingUp, title: "Stratégie de marque", description: "Positionnement, ton, audience et objectifs au cœur de chaque génération." },
  { icon: IconLightbulb, title: "Sujets & angles par IA", description: "Générés à partir du contexte réel de la marque, jamais génériques." },
  { icon: IconWand, title: "Atelier de rédaction", description: "Rédigez avec Claude : réécrire, raccourcir, développer, corriger, storytelling." },
  { icon: IconCalendar, title: "Calendrier éditorial", description: "Planifiez et programmez vos publications sur plusieurs semaines." },
  { icon: IconSend, title: "Publication réelle", description: "Publication LinkedIn dès aujourd'hui, autres réseaux à venir." },
  { icon: IconChartBar, title: "Rapports professionnels", description: "Analyse narrée par IA, à partir de données réelles — jamais un chiffre inventé." },
];

const JOURNEY = ["Marque", "Sujet", "Contenu", "Publication", "Analyse"];

const FEATURES = [
  { icon: IconWand, title: "Copilote éditorial IA", description: "Un assistant conversationnel connecté au contexte réel de votre marque." },
  { icon: IconLightbulb, title: "Générateur de sujets", description: "Des sujets spécifiques et des angles concrets, jamais des titres interchangeables." },
  { icon: IconSparkles, title: "Atelier de rédaction", description: "Génération complète, hooks, plans, réécriture ciblée — toujours avec Claude." },
  { icon: IconCalendar, title: "Calendrier éditorial", description: "Vue claire de ce qui est prévu, programmé et publié." },
  { icon: IconLinkedin, title: "Publication LinkedIn", description: "Connexion OAuth réelle, programmation automatique, suivi des tentatives." },
  { icon: IconChartBar, title: "Rapports narrés par IA", description: "Interne, client ou exécutif — aperçu éditable avant enregistrement." },
  { icon: IconTrendingUp, title: "Performances", description: "Statistiques réelles de publication, jamais de chiffre simulé présenté comme réel." },
  { icon: IconUsers, title: "Espace multi-marques", description: "Gérez plusieurs marques dans un même workspace, isolées les unes des autres." },
  { icon: IconClipboardCheck, title: "Approbation & collaboration", description: "Workflow de validation avec vos clients ou votre équipe avant chaque publication." },
];

export default function BienvenuePage() {
  return (
    <div className="flex min-h-dvh w-full flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600">
              <IconLogoMark className="h-5 w-5 text-white" />
            </span>
            <span className="text-sm font-semibold tracking-tight">ClickPost</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/connexion" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Connexion
            </Link>
            <Link
              href="/inscription"
              className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/20 transition-all hover:from-violet-500 hover:to-fuchsia-500"
            >
              Rejoindre la bêta
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-col">
        {/* HERO */}
        <section className="border-b border-border bg-gradient-to-b from-violet-50/60 to-transparent px-6 py-20 dark:from-violet-500/[.06] sm:py-28">
          <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 text-center">
            <SectionEyebrow>ClickPost — pour créateurs, agences et équipes marketing</SectionEyebrow>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Toute votre stratégie de contenu social,{" "}
              <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                du premier sujet à la preuve du travail accompli
              </span>
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
              ClickPost centralise la stratégie éditoriale, la génération de contenu par IA, la
              planification, l&apos;approbation, la publication et l&apos;analyse de performance —
              pour une ou plusieurs marques, dans une seule plateforme.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/inscription"
                className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500"
              >
                Rejoindre la bêta
              </Link>
              <Link
                href="/connexion"
                className="rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                J&apos;ai déjà un compte
              </Link>
            </div>
          </div>
        </section>

        {/* POUR QUI */}
        <section className="border-b border-border px-6 py-16">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
            <div className="flex flex-col items-center gap-2 text-center">
              <SectionEyebrow>Pour qui</SectionEyebrow>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Conçu pour ceux qui produisent du contenu chaque semaine</h2>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {AUDIENCES.map((audience) => (
                <div key={audience.title} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                    <Icon as={audience.icon} className="h-5 w-5" />
                  </span>
                  <h3 className="text-sm font-semibold">{audience.title}</h3>
                  <p className="text-sm text-muted-foreground">{audience.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PROBLÈMES */}
        <section className="border-b border-border bg-muted/40 px-6 py-16">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
            <div className="flex flex-col items-center gap-2 text-center">
              <SectionEyebrow>Le problème</SectionEyebrow>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Produire du contenu social prend trop de temps, pour trop peu de résultats visibles
              </h2>
            </div>
            <ul className="flex flex-col gap-3">
              {PROBLEMS.map((problem) => (
                <li key={problem} className="flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-500" />
                  <span className="text-foreground">{problem}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* SOLUTION */}
        <section className="border-b border-border px-6 py-16">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
            <div className="flex flex-col items-center gap-2 text-center">
              <SectionEyebrow>La solution ClickPost</SectionEyebrow>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Un seul flux, de la stratégie à la preuve du travail</h2>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {SOLUTION_ITEMS.map((item) => (
                <div key={item.title} className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-6">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600">
                    <Icon as={item.icon} className="h-4 w-4 text-white" />
                  </span>
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PARCOURS */}
        <section className="border-b border-border bg-muted/40 px-6 py-16">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
            <div className="flex flex-col items-center gap-2 text-center">
              <SectionEyebrow>Le parcours</SectionEyebrow>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">De la marque à l&apos;analyse, sans rupture</h2>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:flex-nowrap sm:gap-0">
              {JOURNEY.map((step, index) => (
                <div key={step} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface px-5 py-4 text-center">
                    <span className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
                      Étape {index + 1}
                    </span>
                    <span className="text-sm font-semibold">{step}</span>
                  </div>
                  {index < JOURNEY.length - 1 && (
                    <span aria-hidden="true" className="hidden text-lg text-muted-foreground sm:inline">
                      →
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FONCTIONNALITÉS CLÉS */}
        <section className="border-b border-border px-6 py-16">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
            <div className="flex flex-col items-center gap-2 text-center">
              <SectionEyebrow>Fonctionnalités clés</SectionEyebrow>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Tout ce qu&apos;il faut, rien de superflu</h2>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-5">
                  <Icon as={feature.icon} className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  <h3 className="text-sm font-semibold">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AGENCES */}
        <section className="border-b border-border px-6 py-16">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-600 p-10 text-center text-white sm:p-14">
            <SectionEyebrow>Pour les agences</SectionEyebrow>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Ne vendez plus seulement la création de contenu — démontrez-en la valeur
            </h2>
            <p className="max-w-2xl text-sm text-white/85 sm:text-base">
              Multi-marques, rapports clients générés automatiquement, centralisation de toute la
              production, et un gain de productivité mesurable sur chaque compte géré.
            </p>
            <div className="grid grid-cols-1 gap-4 text-left sm:grid-cols-2">
              <div className="rounded-xl bg-white/10 p-4">
                <span className="text-sm font-semibold">Multi-marques</span>
                <p className="text-xs text-white/80">Gérez tous vos clients dans un seul workspace, isolés les uns des autres.</p>
              </div>
              <div className="rounded-xl bg-white/10 p-4">
                <span className="text-sm font-semibold">Rapports clients</span>
                <p className="text-xs text-white/80">Un rapport professionnel narré par IA, prêt à présenter, en quelques minutes.</p>
              </div>
              <div className="rounded-xl bg-white/10 p-4">
                <span className="text-sm font-semibold">Centralisation</span>
                <p className="text-xs text-white/80">Stratégie, rédaction, calendrier et publication au même endroit.</p>
              </div>
              <div className="rounded-xl bg-white/10 p-4">
                <span className="text-sm font-semibold">Productivité</span>
                <p className="text-xs text-white/80">Moins de temps sur les tâches répétitives, plus de temps sur la stratégie.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA BÊTA */}
        <section className="px-6 py-20">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 text-center">
            <h2 className="text-3xl font-semibold tracking-tight">Rejoindre la bêta ClickPost</h2>
            <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
              La bêta est en cours de constitution. Créez votre compte pour configurer votre
              premier workspace et commencer à tester ClickPost avec votre propre marque.
            </p>
            <Link
              href="/inscription"
              className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500"
            >
              Rejoindre la bêta
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} ClickPost. Tous droits réservés.</span>
          <div className="flex items-center gap-5">
            <Link href="/confidentialite" className="hover:text-foreground hover:underline">
              Confidentialité
            </Link>
            <Link href="/conditions" className="hover:text-foreground hover:underline">
              Conditions
            </Link>
            <Link href="/connexion" className="hover:text-foreground hover:underline">
              Connexion
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
