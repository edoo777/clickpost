"use client";

import { useState } from "react";
import type { BrandDraft } from "@/lib/brands-store";
import { useTranslations } from "@/lib/i18n/locale-provider";

const INPUT_CLASS =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-zinc-800   dark:text-zinc-200";

interface CreateBrandPanelProps {
  onClose: () => void;
  onCreate: (input: BrandDraft) => void;
}

export function CreateBrandPanel({ onClose, onCreate }: CreateBrandPanelProps) {
  const t = useTranslations();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [subNiche, setSubNiche] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [positioning, setPositioning] = useState("");
  const [toneOfVoice, setToneOfVoice] = useState("");
  const [language, setLanguage] = useState("");
  const [market, setMarket] = useState("");
  const [website, setWebsite] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [colorPrimary, setColorPrimary] = useState("");

  const canSubmit = name.trim().length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    onCreate({
      name: name.trim(),
      description: description.trim(),
      industry: industry.trim(),
      subNiche: subNiche.trim() || undefined,
      targetAudience: targetAudience.trim(),
      positioning: positioning.trim() || undefined,
      toneOfVoice: toneOfVoice.trim(),
      languages: language.trim() ? [language.trim()] : [],
      market: market.trim() || undefined,
      website: website.trim() || undefined,
      logoUrl: logoUrl.trim() || undefined,
      colorPrimary: colorPrimary.trim() || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label={t("brands.createPanel.closePanelAria")} onClick={onClose} className="absolute inset-0 bg-black/30" />
      <div className="relative flex h-full w-full max-w-md flex-col gap-5 overflow-y-auto bg-surface p-6 shadow-xl ">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground ">{t("brands.createPanel.title")}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("brands.createPanel.closeAria")}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted  "
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-muted-foreground ">
          {t("brands.createPanel.hint")}
        </p>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("brands.createPanel.nameLabel")}
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder={t("brands.createPanel.namePlaceholder")} className={INPUT_CLASS} autoFocus />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("brands.createPanel.descriptionLabel")}
            <textarea rows={2} value={description} onChange={(event) => setDescription(event.target.value)} className={INPUT_CLASS} />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("brands.createPanel.nicheLabel")}
            <input value={industry} onChange={(event) => setIndustry(event.target.value)} placeholder={t("brands.createPanel.nichePlaceholder")} className={INPUT_CLASS} />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("brands.createPanel.subNicheLabel")}
            <input value={subNiche} onChange={(event) => setSubNiche(event.target.value)} placeholder={t("brands.createPanel.subNichePlaceholder")} className={INPUT_CLASS} />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("brands.createPanel.targetAudienceLabel")}
            <input value={targetAudience} onChange={(event) => setTargetAudience(event.target.value)} placeholder={t("brands.createPanel.targetAudiencePlaceholder")} className={INPUT_CLASS} />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("brands.createPanel.valuePropositionLabel")}
            <textarea rows={2} value={positioning} onChange={(event) => setPositioning(event.target.value)} className={INPUT_CLASS} />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("brands.createPanel.toneLabel")}
            <input value={toneOfVoice} onChange={(event) => setToneOfVoice(event.target.value)} placeholder={t("brands.createPanel.tonePlaceholder")} className={INPUT_CLASS} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {t("brands.createPanel.languageLabel")}
              <input value={language} onChange={(event) => setLanguage(event.target.value)} placeholder={t("brands.createPanel.languagePlaceholder")} className={INPUT_CLASS} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {t("brands.createPanel.marketLabel")}
              <input value={market} onChange={(event) => setMarket(event.target.value)} placeholder={t("brands.createPanel.marketPlaceholder")} className={INPUT_CLASS} />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("brands.createPanel.websiteLabel")}
            <input value={website} onChange={(event) => setWebsite(event.target.value)} placeholder="https://…" className={INPUT_CLASS} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {t("brands.createPanel.logoUrlLabel")}
              <input value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} placeholder="https://…" className={INPUT_CLASS} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {t("brands.createPanel.brandColorLabel")}
              <input type="color" value={colorPrimary || "#7c3aed"} onChange={(event) => setColorPrimary(event.target.value)} className={`${INPUT_CLASS} h-10 p-1`} />
            </label>
          </div>
        </div>

        <div className="mt-auto flex gap-3 border-t border-border pt-4 ">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
          >
            {t("brands.createPanel.cancelButton")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("brands.createPanel.createButton")}
          </button>
        </div>
      </div>
    </div>
  );
}
