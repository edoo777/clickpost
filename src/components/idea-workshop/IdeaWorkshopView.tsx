"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ContentVersionsPanel } from "@/components/idea-workshop/ContentVersionsPanel";
import { StructuredModeFields } from "@/components/idea-workshop/StructuredModeFields";
import { WorkshopPropertiesPanel } from "@/components/idea-workshop/WorkshopPropertiesPanel";
import { WorkshopTopBar, type WorkshopDisplayMode } from "@/components/idea-workshop/WorkshopTopBar";
import { WritingAssistantPanel } from "@/components/idea-workshop/WritingAssistantPanel";
import { WorkshopEditor } from "@/components/idea-workshop/editor/WorkshopEditor";
import { useAccountsSession } from "@/lib/accounts-store";
import type { AIGenerationContext } from "@/lib/assisted-generation";
import { useBrandsSession } from "@/lib/brands-store";
import { useCampaignsSession } from "@/lib/campaigns-store";
import { contentGenerationProvider, type PresetResult, type RewriteSelectionResult } from "@/lib/content-generation-provider";
import { applyVersionToIdea, buildVersionFromIdea, duplicateVersion } from "@/lib/content-versions";
import { useContentWorkspace } from "@/lib/content-workspace-store";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { mapIdeaStatusToPublicationStatus, SYNC_ACTOR_NAME } from "@/lib/idea-publication-sync";
import { buildPostInputFromIdea, firstCommentFromVersion } from "@/lib/idea-transformation";
import { buildNewPost } from "@/lib/posts";
import { usePostsSession } from "@/lib/posts-store";
import type { PromptPreset } from "@/lib/prompt-presets";
import { documentToPlainText, plainTextToDocument } from "@/lib/rich-document";
import { useThemesSession } from "@/lib/themes-store";
import type { ContentVersion } from "@/types/content-version";
import type { Idea, IdeaStatus } from "@/types/idea";
import type { RichDocument } from "@/types/rich-document";

interface IdeaWorkshopViewProps {
  ideaId: string;
}

export function IdeaWorkshopView({ ideaId }: IdeaWorkshopViewProps) {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedMode = searchParams.get("mode") === "ai" ? "ai" : "manual";

  const {
    ideas,
    contentVersions,
    updateIdea,
    addContentVersion,
    updateContentVersion,
    removeContentVersion,
    setActiveContentVersion,
  } = useContentWorkspace();
  const { themes } = useThemesSession();
  const { campaigns } = useCampaignsSession();
  const { accounts } = useAccountsSession();
  const { brands } = useBrandsSession();
  const { posts, addPosts, changeStatus } = usePostsSession();

  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [isCreatingPublication, setIsCreatingPublication] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [pendingResult, setPendingResult] = useState<{ preset: PromptPreset; result: PresetResult } | null>(null);
  const [isRunningPreset, setIsRunningPreset] = useState(false);
  const hasAutoRun = useRef(false);

  useEffect(() => {
    if (!confirmation) return;
    const timeout = setTimeout(() => setConfirmation(null), 4000);
    return () => clearTimeout(timeout);
  }, [confirmation]);

  const idea = ideas.find((candidate) => candidate.id === ideaId);

  const brand = idea ? brands.find((candidate) => candidate.id === idea.brandId) : undefined;
  const theme = idea ? themes.find((candidate) => candidate.id === idea.themeId) : undefined;
  const versions = idea ? contentVersions.filter((version) => version.ideaId === idea.id) : [];
  const currentVersion = versions.find((version) => version.isCurrent);

  function applyGeneratedVersion(version: ContentVersion) {
    versions.filter((v) => v.isCurrent).forEach((v) => updateContentVersion(v.id, { ...v, isCurrent: false }));
    addContentVersion(version);
    const patch: Partial<Idea> = { activeVersionId: version.id };
    if (version.format === "text") Object.assign(patch, applyVersionToIdea(version));
    updateIdea(idea!.id, patch);
  }

  useEffect(() => {
    if (requestedMode !== "ai" || hasAutoRun.current || !idea || !brand) return;
    hasAutoRun.current = true;
    const hasContent = documentToPlainText(idea.documentContent).trim().length > 0 || (idea.body ?? "").trim().length > 0;
    if (hasContent) return;
    const context: AIGenerationContext = { idea, brand, theme, tone: idea.tone ?? "professional", length: "medium", instructions: "" };
    // Différé hors du corps synchrone de l'effet (règle react-hooks/set-state-in-effect) : la
    // génération automatique à l'ouverture reste sur le générateur simulé en F2.1 (jamais
    // d'appel Claude déclenché sans action explicite de l'utilisateur, voir generateFullContent
    // dans RemoteAIContentGenerationProvider).
    setTimeout(() => {
      void (async () => {
        const version = await contentGenerationProvider.generateFullContent(context, idea.format ?? "text", versions);
        applyGeneratedVersion(version);
        setConfirmation(t("ideaWorkshop.view.autoGeneratedNotice"));
      })();
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedMode, idea?.id]);

  if (!idea) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Link href="/boite-idees?tab=banque" className="w-fit text-sm font-medium text-muted-foreground hover:underline">
          ← {t("ideaWorkshop.view.backToBank")}
        </Link>
        <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-muted-foreground dark:border-white/[.12]">
          {t("ideaWorkshop.view.notFound")}
        </p>
      </div>
    );
  }

  function set<K extends keyof Idea>(key: K, value: Idea[K]) {
    updateIdea(idea!.id, { [key]: value } as Partial<Idea>);
  }

  function handleChangeStatus(status: IdeaStatus) {
    set("status", status);
    if (!idea!.publicationId) return;
    const publication = posts.find((post) => post.id === idea!.publicationId);
    if (!publication) return;
    const mapped = mapIdeaStatusToPublicationStatus(status);
    if (mapped && mapped !== publication.status) {
      changeStatus(publication.id, mapped, SYNC_ACTOR_NAME);
    }
  }

  function handleSaveNewVersion() {
    const version = buildVersionFromIdea(idea!, versions, "manual");
    versions.filter((v) => v.isCurrent).forEach((v) => updateContentVersion(v.id, { ...v, isCurrent: false }));
    addContentVersion(version);
    updateIdea(idea!.id, { activeVersionId: version.id });
    setConfirmation(t("ideaWorkshop.view.newVersionSaved"));
  }

  function handleRestoreVersion(versionId: string) {
    const target = versions.find((v) => v.id === versionId);
    if (!target) return;
    const snapshot = buildVersionFromIdea(idea!, versions, "manual", "Avant restauration");
    versions.filter((v) => v.isCurrent).forEach((v) => updateContentVersion(v.id, { ...v, isCurrent: false }));
    addContentVersion({ ...snapshot, isCurrent: false });
    setActiveContentVersion(idea!.id, target.id);
    updateIdea(idea!.id, { ...applyVersionToIdea(target), activeVersionId: target.id });
    const versionName = target.name || t("ideaWorkshop.view.versionFallbackName", { number: target.versionNumber });
    setConfirmation(t("ideaWorkshop.view.versionRestored", { name: versionName }));
  }

  function handleDuplicateVersion(versionId: string) {
    const target = versions.find((v) => v.id === versionId);
    if (!target) return;
    addContentVersion(duplicateVersion(target, versions));
    setConfirmation(t("ideaWorkshop.view.versionDuplicated"));
  }

  function handleDeleteVersion(versionId: string) {
    if (!window.confirm(t("ideaWorkshop.view.confirmDeleteVersion"))) return;
    removeContentVersion(versionId);
  }

  function buildContext(): AIGenerationContext | null {
    if (!brand) return null;
    return { idea: idea!, brand, theme, tone: idea!.tone ?? "professional", length: "medium", instructions: "" };
  }

  function handleDocumentChange(doc: RichDocument) {
    updateIdea(idea!.id, { documentContent: doc, body: documentToPlainText(doc) });
  }

  async function handleRunPreset(preset: PromptPreset) {
    const context = buildContext();
    if (!context) return;
    setIsRunningPreset(true);
    try {
      const result = await contentGenerationProvider.generateFromPreset(preset, context, currentVersion, versions);
      if (!result) return;
      if (result.kind === "version") {
        applyGeneratedVersion(result.version);
        const sourceLabel = result.source === "claude" ? t("ideaWorkshop.view.sourceClaude") : t("ideaWorkshop.view.sourceSimulated");
        const fallbackNote = result.fallbackReason ? t("ideaWorkshop.view.presetAppliedFallbackNote") : "";
        setConfirmation(`${t("ideaWorkshop.view.presetApplied", { preset: preset.name, source: sourceLabel })}${fallbackNote}`);
      } else {
        setPendingResult({ preset, result });
      }
    } finally {
      setIsRunningPreset(false);
    }
  }

  function handleInsertListItem(item: string) {
    if (!pendingResult) return;
    if (pendingResult.preset.action === "hooks") {
      set("hook", item);
    } else {
      const merged = [documentToPlainText(idea!.documentContent), item].filter(Boolean).join("\n\n");
      handleDocumentChange(plainTextToDocument(merged));
    }
    setPendingResult(null);
    setConfirmation(t("ideaWorkshop.view.propositionInserted"));
  }

  async function handleRewriteSelection(selectedText: string, instruction: string): Promise<RewriteSelectionResult> {
    const context = buildContext();
    if (!context) return { text: selectedText, source: "simulated" };
    return contentGenerationProvider.rewriteSelection(selectedText, instruction, context);
  }

  function handleCreatePublication() {
    if (!idea!.platform || isCreatingPublication || idea!.publicationId) return;
    setIsCreatingPublication(true);
    const brandName = brand?.name ?? idea!.brandId;
    const account =
      accounts.find(
        (candidate) => candidate.brand === brandName && candidate.platform === idea!.platform && candidate.status === "connected"
      ) ?? accounts.find((candidate) => candidate.brand === brandName && candidate.status === "connected");
    const input = buildPostInputFromIdea(idea!, currentVersion, brandName, theme?.label ?? "");
    const publication = {
      ...buildNewPost({ ...input, accountId: account?.id }),
      firstComment: firstCommentFromVersion(currentVersion, idea!),
      ideaId: idea!.id,
    };
    addPosts([publication]);
    updateIdea(idea!.id, { publicationId: publication.id, status: "ready_to_schedule" });
    router.push(`/publications/${publication.id}`);
  }

  const mode: WorkshopDisplayMode = idea.workshopDisplayMode ?? "document";

  const primaryAction = (() => {
    if (!idea.publicationId) {
      return {
        label: t("ideaWorkshop.view.transformToPublication"),
        onClick: handleCreatePublication,
        disabled: !idea.platform || isCreatingPublication,
        disabledHint: !idea.platform ? t("ideaWorkshop.view.selectNetworkHint") : undefined,
      };
    }
    if (idea.status === "in_review") return { label: t("ideaWorkshop.view.approve"), onClick: () => handleChangeStatus("approved") };
    if (idea.status === "approved")
      return { label: t("ideaWorkshop.view.schedule"), onClick: () => handleChangeStatus("ready_to_schedule") };
    if (idea.status === "scheduled" || idea.status === "published" || idea.status === "ready_to_schedule") return null;
    return { label: t("ideaWorkshop.view.sendToReview"), onClick: () => handleChangeStatus("in_review") };
  })();

  return (
    <div className="flex min-h-full flex-col">
      <WorkshopTopBar
        idea={idea}
        brandLabel={brand?.name ?? idea.brandId}
        themeLabel={theme?.label}
        mode={mode}
        onModeChange={(next) => set("workshopDisplayMode", next)}
        onTitleChange={(title) => set("title", title)}
        primaryAction={primaryAction}
        onSaveVersion={handleSaveNewVersion}
      />

      {confirmation && (
        <p className="mx-4 mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 sm:mx-6">
          {confirmation}
        </p>
      )}

      <div className="flex flex-1 flex-col lg:flex-row">
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-10">
          <div className="mx-auto flex w-full max-w-3xl flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-10">
            {mode === "document" ? (
              <WorkshopEditor
                key={idea.activeVersionId ?? "draft"}
                initialContent={idea.documentContent}
                onChange={handleDocumentChange}
                onRewriteSelection={handleRewriteSelection}
                placeholder={t("ideaWorkshop.view.documentPlaceholder")}
              />
            ) : (
              <StructuredModeFields
                hook={idea.hook ?? ""}
                onHookChange={(value) => set("hook", value)}
                cta={idea.cta ?? ""}
                onCtaChange={(value) => set("cta", value)}
              >
                <WorkshopEditor
                  key={idea.activeVersionId ?? "draft"}
                  initialContent={idea.documentContent}
                  onChange={handleDocumentChange}
                  onRewriteSelection={handleRewriteSelection}
                  placeholder={t("ideaWorkshop.view.bodyPlaceholder")}
                />
              </StructuredModeFields>
            )}
          </div>
        </div>

        <WritingAssistantPanel
          isCollapsed={isPanelCollapsed}
          onToggleCollapsed={() => setIsPanelCollapsed((prev) => !prev)}
          onRunPreset={handleRunPreset}
          isRunningPreset={isRunningPreset}
          resultSlot={
            pendingResult ? (
              <div className="mb-3 flex flex-col gap-2 rounded-xl border border-violet-200 bg-violet-50 p-3 dark:border-violet-500/30 dark:bg-violet-500/10">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">
                    {pendingResult.result.kind !== "version" ? pendingResult.result.label : ""}
                  </p>
                  <button
                    type="button"
                    onClick={() => setPendingResult(null)}
                    className="shrink-0 text-xs font-medium text-violet-600 hover:underline dark:text-violet-400"
                  >
                    {t("common.close")}
                  </button>
                </div>
                <ul className="flex flex-col gap-1.5">
                  {pendingResult.result.kind !== "version" &&
                    pendingResult.result.items.map((item, index) => (
                      <li key={index}>
                        {pendingResult.result.kind === "text_list" ? (
                          <button
                            type="button"
                            onClick={() => handleInsertListItem(item)}
                            className="w-full rounded-lg bg-surface px-2.5 py-2 text-left text-xs text-foreground hover:bg-violet-100 dark:hover:bg-violet-500/20"
                          >
                            {item}
                          </button>
                        ) : (
                          <p className="rounded-lg bg-surface px-2.5 py-2 text-xs text-foreground">{item}</p>
                        )}
                      </li>
                    ))}
                </ul>
              </div>
            ) : null
          }
          propertiesSlot={
            <WorkshopPropertiesPanel
              idea={idea}
              brandLabel={brand?.name ?? idea.brandId}
              themeLabel={theme?.label}
              campaigns={campaigns}
              onFieldChange={set}
              onStatusChange={handleChangeStatus}
            />
          }
          versionsSlot={
            <ContentVersionsPanel
              versions={versions}
              onSaveNewVersion={handleSaveNewVersion}
              onRestore={handleRestoreVersion}
              onDuplicate={handleDuplicateVersion}
              onDelete={handleDeleteVersion}
            />
          }
        />
      </div>
    </div>
  );
}
