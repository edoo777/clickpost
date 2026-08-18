import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import Script from "next/script";
import { LocaleProfileSync } from "@/components/i18n/LocaleProfileSync";
import { DEFAULT_LOCALE, isSupportedLocale, LOCALE_COOKIE_NAME } from "@/lib/i18n/locale";
import { LocaleProvider } from "@/lib/i18n/locale-provider";
import { ThemeProvider } from "@/lib/theme-store";
import { WorkspaceSessionProvider } from "@/lib/supabase/workspace-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ClickPost",
  description: "Gestion de contenu social multi-marques et multi-comptes.",
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = window.localStorage.getItem('clickpost-theme');
    var theme = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
    var resolved = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    var root = document.documentElement;
    if (resolved === 'dark') root.classList.add('dark');
    root.style.colorScheme = resolved;
  } catch (e) {}
  try {
    // Doit rester synchronisé avec SIDEBAR_MIN_WIDTH/SIDEBAR_MAX_WIDTH/SIDEBAR_DEFAULT_WIDTH
    // de src/lib/sidebar-store.tsx — dupliqué ici uniquement pour éviter un flash avant hydratation.
    var collapsed = window.localStorage.getItem('clickpost-sidebar-collapsed') === 'true';
    var storedWidth = parseInt(window.localStorage.getItem('clickpost-sidebar-width'), 10);
    var width = isFinite(storedWidth) && storedWidth > 0 ? Math.min(480, Math.max(260, storedWidth)) : 320;
    document.documentElement.style.setProperty('--sidebar-w', collapsed ? '5rem' : (width + 'px'));
  } catch (e) {}
  try {
    var cachedBranding = window.localStorage.getItem('clickpost-branding');
    if (cachedBranding) {
      var branding = JSON.parse(cachedBranding).branding;
      var root2 = document.documentElement;
      if (branding.color_primary) root2.style.setProperty('--brand-primary', branding.color_primary);
      if (branding.color_secondary) root2.style.setProperty('--brand-secondary', branding.color_secondary);
      if (branding.color_accent) root2.style.setProperty('--brand-accent', branding.color_accent);
      if (branding.color_sidebar) root2.style.setProperty('--brand-sidebar', branding.color_sidebar);
      if (branding.color_button) root2.style.setProperty('--brand-button', branding.color_button);
      if (branding.color_link) root2.style.setProperty('--brand-link', branding.color_link);
    }
  } catch (e) {}
})();
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Lu côté serveur pour que le tout premier rendu HTML soit déjà dans la bonne langue — jamais
  // un flash de contenu français pour un visiteur anglophone revenant avec son cookie déjà posé
  // (voir locale-provider.tsx pour la persistance et LocaleProfileSync pour la resynchronisation
  // avec `profiles.ui_locale` une fois authentifié).
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  const initialLocale = isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  return (
    <html
      lang={initialLocale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Script id="clickpost-theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <ThemeProvider>
          <LocaleProvider initialLocale={initialLocale}>
            <WorkspaceSessionProvider>
              <LocaleProfileSync />
              {children}
            </WorkspaceSessionProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
