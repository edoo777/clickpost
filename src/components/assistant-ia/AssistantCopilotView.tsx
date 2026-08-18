"use client";

import { useMemo, useState } from "react";
import { useBrandsSession } from "@/lib/brands-store";
import { useContentWorkspace } from "@/lib/content-workspace-store";
import { usePostsSession } from "@/lib/posts-store";
import { useThemesSession } from "@/lib/themes-store";
import { runCopilotConversation } from "@/lib/ai/copilot-client";
import type { CopilotHistoryItem } from "@/lib/ai/validate-copilot-request";
import { IconSparkles, IconSend, IconLightbulb, IconChatBubble, IconClock } from "@/components/icons";
import { useTranslations } from "@/lib/i18n/locale-provider";

function buildActiveThemesList(themes: { id: string; label: string }[]): string | null {
  const activeThemes = themes.map((theme) => theme.label).slice(0, 5);
  if (activeThemes.length === 0) return null;
  return activeThemes.join(", ");
}

export function AssistantCopilotView() {
  const t = useTranslations();
  const SUGGESTIONS = [
    t("assistant.copilot.suggestion1"),
    t("assistant.copilot.suggestion2"),
    t("assistant.copilot.suggestion3"),
    t("assistant.copilot.suggestion4"),
    t("assistant.copilot.suggestion5"),
    t("assistant.copilot.suggestion6"),
    t("assistant.copilot.suggestion7"),
    t("assistant.copilot.suggestion8"),
  ];
  const { activeBrand, brands } = useBrandsSession();
  const { ideas } = useContentWorkspace();
  const { posts } = usePostsSession();
  const { themes } = useThemesSession();
  const [brandId, setBrandId] = useState(activeBrand?.id ?? brands[0]?.id ?? "");
  const [trackedActiveBrandId, setTrackedActiveBrandId] = useState(activeBrand?.id);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<CopilotHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);

  if (activeBrand?.id !== trackedActiveBrandId) {
    setTrackedActiveBrandId(activeBrand?.id);
    if (activeBrand?.id) {
      setBrandId(activeBrand.id);
    }
  }

  const brand = useMemo(() => brands.find((candidate) => candidate.id === brandId) ?? null, [brands, brandId]);
  const brandIdeas = useMemo(() => ideas.filter((idea) => idea.brandId === brandId), [ideas, brandId]);
  const brandPosts = useMemo(() => posts.filter((post) => post.brand === brand?.name), [posts, brand]);
  const brandThemes = useMemo(() => themes.filter((theme) => theme.brandId === brandId && theme.active), [themes, brandId]);

  const contextSummary = brand
    ? t("assistant.copilot.contextSummary", {
        brandName: brand.name,
        accountsCount: brand.socialPlatforms.length,
        accountsPlural: brand.socialPlatforms.length > 1 ? "x" : "",
        ideasCount: brandIdeas.length,
        ideasPlural: brandIdeas.length > 1 ? "s" : "",
        publicationsCount: brandPosts.length,
        publicationsPlural: brandPosts.length > 1 ? "s" : "",
      })
    : null;

  const activeThemesList = useMemo(() => buildActiveThemesList(brandThemes), [brandThemes]);

  const handleSend = async () => {
    if (!brand || !input.trim()) return;
    setErrorMessage(null);
    const userMessage = input.trim();
    const updatedHistory = [...history, { role: "user" as const, content: userMessage }].slice(-10);
    setHistory(updatedHistory);
    setConversations((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await runCopilotConversation({ brandId: brand.id, message: userMessage, history: updatedHistory });
      const assistantContent = response.text.trim();
      setConversations((prev) => [...prev, { role: "assistant", content: assistantContent }]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("assistant.copilot.unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestion = (value: string) => {
    setInput(value);
    setTimeout(() => {
      const inputEl = document.getElementById("copilot-input") as HTMLTextAreaElement | null;
      inputEl?.focus();
    }, 0);
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("pageTitle.assistant")}</h1>
            <p className="max-w-3xl text-sm text-muted-foreground">{t("assistant.copilot.subtitle")}</p>
          </div>
          {brand && (
            <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-muted-foreground">
              {contextSummary}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface p-3 text-xs text-muted-foreground">
            <IconSparkles className="h-4 w-4" />
            {brand ? (
              <span>{t("assistant.copilot.activeBrandPrefix", { name: brand.name })}</span>
            ) : (
              <span>{t("assistant.copilot.noActiveBrand")}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1">{t("assistant.copilot.badgeConversational")}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1">{t("assistant.copilot.badgeHistory")}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1">{t("assistant.copilot.badgeActions")}</span>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4 rounded-3xl border border-border bg-surface p-4">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">{t("assistant.copilot.quickSuggestionsTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("assistant.copilot.quickSuggestionsHint")}</p>
          </div>
          <div className="grid gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestion(suggestion)}
                className="rounded-2xl border border-border bg-white px-4 py-3 text-left text-sm text-foreground transition hover:border-violet-200 hover:bg-violet-50 dark:bg-surface dark:hover:bg-violet-500/10"
              >
                {suggestion}
              </button>
            ))}
          </div>
          <div className="space-y-2 rounded-3xl border border-border bg-surface p-4">
            <h3 className="text-sm font-semibold text-foreground">{t("assistant.copilot.brandContextTitle")}</h3>
            {brand ? (
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><strong className="text-foreground">{t("assistant.copilot.sectorLabel")}</strong> {brand.industry || t("assistant.copilot.notSpecified")}</li>
                <li><strong className="text-foreground">{t("assistant.copilot.positioningLabel")}</strong> {brand.positioning || t("assistant.copilot.notSpecified")}</li>
                <li><strong className="text-foreground">{t("assistant.copilot.audienceLabel")}</strong> {brand.targetAudience || t("assistant.copilot.notSpecifiedFem")}</li>
                <li><strong className="text-foreground">{t("assistant.copilot.networksLabel")}</strong> {brand.socialPlatforms.join(", ") || t("assistant.copilot.none")}</li>
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{t("assistant.copilot.selectBrandHint")}</p>
            )}
          </div>
          <div className="space-y-2 rounded-3xl border border-border bg-surface p-4">
            <h3 className="text-sm font-semibold text-foreground">{t("assistant.copilot.editorialContextTitle")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("assistant.copilot.ideasAndPublicationsSummary", {
                ideasCount: brandIdeas.length,
                ideasPlural: brandIdeas.length > 1 ? "s" : "",
                postsCount: brandPosts.length,
                postsPlural: brandPosts.length > 1 ? "s" : "",
              })}
            </p>
            {activeThemesList && (
              <p className="text-sm text-muted-foreground">
                {t("assistant.copilot.activeThemesSummary", { themes: activeThemesList })}
              </p>
            )}
          </div>
        </aside>

        <section className="flex min-h-[520px] flex-col rounded-3xl border border-border bg-surface">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">{t("assistant.copilot.conversationTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("assistant.copilot.conversationHint")}</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              <IconChatBubble className="h-4 w-4" /> {t("assistant.copilot.historyKept")}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {conversations.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border/80 bg-muted px-6 py-12 text-center text-sm text-muted-foreground">
                {t("assistant.copilot.emptyConversation")}
              </div>
            ) : (
              <div className="space-y-4">
                {conversations.map((entry, index) => (
                  <div key={`${entry.role}-${index}`} className={`rounded-3xl p-4 ${entry.role === "user" ? "bg-violet-50 text-violet-900" : "bg-white text-zinc-900 dark:bg-surface"}`}>
                    <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                      <span>{entry.role === "user" ? t("assistant.copilot.roleUser") : t("assistant.copilot.roleAssistant")}</span>
                      <span className="h-1 w-1 rounded-full bg-current/20" />
                      <span>{entry.role === "user" ? t("assistant.copilot.kindQuestion") : t("assistant.copilot.kindAnswer")}</span>
                    </div>
                    <p className="whitespace-pre-line text-sm leading-6">{entry.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border px-4 py-4">
            <label className="sr-only" htmlFor="copilot-input">{t("assistant.copilot.inputLabel")}</label>
            <textarea
              id="copilot-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={4}
              placeholder={t("assistant.copilot.inputPlaceholder")}
              className="w-full rounded-3xl border border-border bg-white px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200 dark:bg-surface"
              disabled={!brand || isLoading}
            />
            {errorMessage && <p className="mt-2 text-sm text-rose-600">{errorMessage}</p>}
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1"><IconClock className="h-4 w-4" /> {t("assistant.copilot.realTime")}</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1"><IconLightbulb className="h-4 w-4" /> {t("assistant.copilot.recommendedActions")}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!brand || !input.trim() || isLoading}
                  className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <IconSend className="h-4 w-4" />
                  {isLoading ? t("assistant.copilot.sending") : t("assistant.copilot.send")}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
