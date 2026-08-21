import Link from "next/link";
import { IconLogoMark } from "@/components/icons";
import { useTranslations, type TranslationKey } from "@/lib/i18n/locale-provider";

interface FooterColumn {
  titleKey: TranslationKey;
  links: { href: string; labelKey: TranslationKey }[];
}

const COLUMNS: FooterColumn[] = [
  {
    titleKey: "marketing.footer.columns.product",
    links: [
      { href: "/solution", labelKey: "marketing.footer.links.solution" },
      { href: "/solution#fonctionnalites", labelKey: "marketing.footer.links.features" },
      { href: "/prix", labelKey: "marketing.footer.links.pricing" },
    ],
  },
  {
    titleKey: "marketing.footer.columns.resources",
    links: [
      { href: "/blog", labelKey: "marketing.footer.links.blog" },
      { href: "/ressources#guides", labelKey: "marketing.footer.links.guides" },
      { href: "/ressources#centre-aide", labelKey: "marketing.footer.links.helpCenter" },
    ],
  },
  {
    titleKey: "marketing.footer.columns.company",
    links: [{ href: "/contact", labelKey: "marketing.footer.links.contact" }],
  },
  {
    titleKey: "marketing.footer.columns.legal",
    links: [
      { href: "/conditions", labelKey: "marketing.footer.links.terms" },
      { href: "/confidentialite", labelKey: "marketing.footer.links.privacy" },
      { href: "/cookies", labelKey: "marketing.footer.links.cookies" },
    ],
  },
];

/** Pied de page du site public — mêmes colonnes sur toutes les pages marketing. */
export function MarketingFooter() {
  const t = useTranslations();

  return (
    <footer className="border-t border-border px-6 py-14">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="flex max-w-xs flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600">
                <IconLogoMark className="h-5 w-5 text-white" />
              </span>
              <span className="text-sm font-semibold tracking-tight text-foreground">ClickPost</span>
            </div>
            <p className="text-sm text-muted-foreground">{t("marketing.footer.tagline")}</p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((column) => (
              <div key={column.titleKey} className="flex flex-col gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t(column.titleKey)}</span>
                <ul className="flex flex-col gap-2">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground hover:underline">
                        {t(link.labelKey)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <span>
            © {new Date().getFullYear()} ClickPost. {t("marketing.footer.rights")}
          </span>
          <Link href="/connexion" className="hover:text-foreground hover:underline">
            {t("auth.signIn")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
