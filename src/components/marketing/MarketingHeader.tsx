"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { IconClose, IconLogoMark, IconMenu } from "@/components/icons";
import { useTranslations } from "@/lib/i18n/locale-provider";

const NAV_LINKS: { href: string; key: "home" | "solution" | "pricing" | "resources" | "contact" }[] = [
  { href: "/bienvenue", key: "home" },
  { href: "/solution", key: "solution" },
  { href: "/prix", key: "pricing" },
  { href: "/ressources", key: "resources" },
  { href: "/contact", key: "contact" },
];

/**
 * En-tête du site public — partagé par toutes les pages marketing (accueil, solution, prix,
 * ressources/blog, contact). Devient collant avec un fond flouté dès que la page défile, pour
 * rester utilisable sur une page longue avec beaucoup de sections (voir le mandat). Logo/CTA
 * identiques à `BienvenueView.tsx` (aucun nouveau style introduit).
 */
export function MarketingHeader() {
  const t = useTranslations();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(() => typeof window !== "undefined" && window.scrollY > 8);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 8);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setIsMobileMenuOpen(false), 0);
    return () => clearTimeout(timeout);
  }, [pathname]);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-colors ${
        isScrolled ? "border-border bg-background/85 backdrop-blur-md" : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/bienvenue" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600">
            <IconLogoMark className="h-5 w-5 text-white" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-foreground">ClickPost</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                pathname === link.href ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(`marketing.nav.${link.key}`)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher compact />
          <Link href="/connexion" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            {t("auth.signIn")}
          </Link>
          <Link
            href="/inscription"
            className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/20 transition-all hover:from-violet-500 hover:to-fuchsia-500"
          >
            {t("marketing.nav.startFree")}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          aria-label={t("marketing.nav.menuAria")}
          aria-expanded={isMobileMenuOpen}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground md:hidden"
        >
          {isMobileMenuOpen ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="border-t border-border bg-background px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium ${
                  pathname === link.href ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {t(`marketing.nav.${link.key}`)}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <LanguageSwitcher compact />
              <Link href="/connexion" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                {t("auth.signIn")}
              </Link>
            </div>
            <Link
              href="/inscription"
              className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-md shadow-fuchsia-500/20"
            >
              {t("marketing.nav.startFree")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
