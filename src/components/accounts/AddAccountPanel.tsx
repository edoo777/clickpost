"use client";

import { useState } from "react";
import { useBrandsSession } from "@/lib/brands-store";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { usePlatformLabel } from "@/lib/post-status";
import type { Brand } from "@/types/brand";
import type { SocialPlatform } from "@/types/dashboard";

const ALL_PLATFORMS: SocialPlatform[] = [
  "instagram",
  "facebook",
  "linkedin",
  "tiktok",
  "youtube",
  "x",
  "threads",
  "pinterest",
  "other",
];

const INPUT_CLASS =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-zinc-800   dark:text-zinc-200";

export interface NewAccountInput {
  brand: string;
  brandId?: string;
  platform: SocialPlatform;
  accountName: string;
  handle: string;
  profileUrl: string;
  language: string;
  audienceOrMarket: string;
}

interface AddAccountPanelProps {
  onClose: () => void;
  onSave: (input: NewAccountInput) => void;
  /** Fournie quand le panneau est ouvert depuis la fiche d'une marque — verrouille la marque et
   * masque le sélecteur, pour ne jamais permettre d'associer le compte à la mauvaise marque. */
  fixedBrand?: Brand;
}

export function AddAccountPanel({ onClose, onSave, fixedBrand }: AddAccountPanelProps) {
  const { brands } = useBrandsSession();
  const [brandId, setBrandId] = useState(fixedBrand?.id ?? brands[0]?.id ?? "");
  const [platform, setPlatform] = useState<SocialPlatform>("instagram");
  const [accountName, setAccountName] = useState("");
  const [handle, setHandle] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [language, setLanguage] = useState("");
  const [audienceOrMarket, setAudienceOrMarket] = useState("");
  const PLATFORM_LABEL = usePlatformLabel();
  const t = useTranslations();

  const selectedBrand = fixedBrand ?? brands.find((candidate) => candidate.id === brandId);

  function handleSubmit() {
    if (!selectedBrand) return;
    onSave({
      brand: selectedBrand.name,
      brandId: selectedBrand.id,
      platform,
      accountName: accountName.trim() || selectedBrand.name,
      handle: handle.trim(),
      profileUrl: profileUrl.trim(),
      language: language.trim(),
      audienceOrMarket: audienceOrMarket.trim(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label={t("accounts.addPanel.closePanelAria")} onClick={onClose} className="absolute inset-0 bg-black/30" />
      <div className="relative flex h-full w-full max-w-md flex-col gap-5 overflow-y-auto bg-surface p-6 shadow-xl ">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground ">{t("accounts.addPanel.title")}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("accounts.addPanel.closeAria")}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted  "
          >
            ✕
          </button>
        </div>

        <p className="rounded-lg bg-violet-50 px-3 py-2 text-xs font-medium text-violet-700 dark:bg-violet-500/10 dark:text-violet-400">
          {t("accounts.addPanel.notice")}
        </p>

        <div className="flex flex-col gap-4">
          {fixedBrand ? (
            <div className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {t("accounts.addPanel.brandLabel")}
              <span className={`${INPUT_CLASS} text-muted-foreground`}>{fixedBrand.name}</span>
            </div>
          ) : (
            <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {t("accounts.addPanel.brandLabel")}
              <select value={brandId} onChange={(event) => setBrandId(event.target.value)} className={INPUT_CLASS}>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("accounts.addPanel.platformLabel")}
            <select value={platform} onChange={(event) => setPlatform(event.target.value as SocialPlatform)} className={INPUT_CLASS}>
              {ALL_PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {PLATFORM_LABEL[p]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("accounts.addPanel.displayNameLabel")}
            <input value={accountName} onChange={(event) => setAccountName(event.target.value)} placeholder={selectedBrand?.name ?? ""} className={INPUT_CLASS} />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("accounts.addPanel.handleLabel")}
            <input value={handle} onChange={(event) => setHandle(event.target.value)} placeholder={t("accounts.addPanel.handlePlaceholder")} className={INPUT_CLASS} />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("accounts.addPanel.profileUrlLabel")}
            <input value={profileUrl} onChange={(event) => setProfileUrl(event.target.value)} placeholder="https://…" className={INPUT_CLASS} />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("accounts.addPanel.languageLabel")}
            <input value={language} onChange={(event) => setLanguage(event.target.value)} placeholder={t("accounts.addPanel.languagePlaceholder")} className={INPUT_CLASS} />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("accounts.addPanel.audienceMarketLabel")}
            <input value={audienceOrMarket} onChange={(event) => setAudienceOrMarket(event.target.value)} placeholder={t("accounts.addPanel.audienceMarketPlaceholder")} className={INPUT_CLASS} />
          </label>
        </div>

        <div className="mt-auto flex gap-3 border-t border-border pt-4 ">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
          >
            {t("accounts.addPanel.cancelButton")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedBrand}
            className="flex-1 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("accounts.addPanel.saveButton")}
          </button>
        </div>
      </div>
    </div>
  );
}
