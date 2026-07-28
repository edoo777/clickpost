"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AIGenerationPanel } from "@/components/idea-workshop/AIGenerationPanel";
import { ContentVersionsPanel } from "@/components/idea-workshop/ContentVersionsPanel";
import { IdeaWorkshopSection } from "@/components/idea-workshop/IdeaWorkshopSection";
import {
  adaptForPlatform,
  buildAIVersion,
  changeTone,
  expandText,
  regenerateTextSection,
  shortenText,
  simplifyText,
  type AIGenerationContext,
  type GenerationLength,
  type GenerationTone,
  type TextSection,
} from "@/lib/assisted-generation";
import { useAccountsSession } from "@/lib/accounts-store";
import { brandProfiles } from "@/lib/brand-profiles";
import {
  applyVersionToIdea,
  buildTransformedVersion,
  buildVersionFromIdea,
  duplicateVersion,
} from "@/lib/content-versions";
import { useContentWorkspace } from "@/lib/content-workspace-store";
import { CONTENT_FORMATS, FORMAT_LABEL } from "@/lib/editorial-constants";
import { mapIdeaStatusToPublicationStatus, SYNC_ACTOR_NAME } from "@/lib/idea-publication-sync";
import { buildPostInputFromIdea, firstCommentFromVersion } from "@/lib/idea-transformation";
import { IDEA_STATUS_LABEL, IDEA_STATUS_ORDER, IDEA_STATUS_STYLE, PRIORITY_LABEL } from "@/lib/idea-status";
import { PLATFORM_LABEL } from "@/lib/post-status";
import { buildNewPost } from "@/lib/posts";
import { usePostsSession } from "@/lib/posts-store";
import { useThemesSession } from "@/lib/themes-store";
import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";
import type { ContentVersion } from "@/types/content-version";
import type { Idea, IdeaStatus } from "@/types/idea";
import type { ContentPriority, PublicationMedia } from "@/types/publication";

const ALL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "x", "youtube"];
const ALL_PRIORITIES: ContentPriority[] = ["low", "medium", "high"];

const FIELD_CLASS =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 dark:border-white/[.08] dark:bg-zinc-950 dark:text-zinc-200";

function TextField({
  label,
  value,
  multiline,
  onChange,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
      {label}
      {multiline ? (
        <textarea rows={3} value={value} onChange={(event) => onChange(event.target.value)} className={FIELD_CLASS} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} className={FIELD_CLASS} />
      )}
    </label>
  );
}

function ListField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
      {label}
      <textarea
        rows={3}
        value={value.join("\n")}
        placeholder="Une valeur par ligne"
        onChange={(event) => onChange(event.target.value.split("\n"))}
        className={FIELD_CLASS}
      />
    </label>
  );
}

function MediaField({
  value,
  onChange,
}: {
  value: PublicationMedia[];
  onChange: (value: PublicationMedia[]) => void;
}) {
  function update(id: string, patch: Partial<PublicationMedia>) {
    onChange(value.map((media) => (media.id === id ? { ...media, ...patch } : media)));
  }
  function remove(id: string) {
    onChange(value.filter((media) => media.id !== id));
  }
  function add() {
    onChange([...value, { id: crypto.randomUUID(), type: "image", label: "" }]);
  }

  return (
    <div className="flex flex-col gap-2">
      {value.map((media) => (
        <div
          key={media.id}
          className="flex items-center gap-2 rounded-lg border border-zinc-200 p-2 dark:border-white/[.08]"
        >
          <select
            value={media.type}
            onChange={(event) => update(media.id, { type: event.target.value as PublicationMedia["type"] })}
            className={`${FIELD_CLASS} w-auto`}
          >
            <option value="image">Image</option>
            <option value="video">Vidéo</option>
          </select>
          <input
            value={media.label}
            placeholder="nom-du-fichier.jpg"
            onChange={(event) => update(media.id, { label: event.target.value })}
            className={FIELD_CLASS}
          />
          <button
            type="button"
            onClick={() => remove(media.id)}
            className="shrink-0 text-xs font-medium text-red-500 hover:underline"
          >
            Supprimer
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="w-fit rounded-lg border border-dashed border-zinc-400 px-3 py-1.5 text-xs font-medium text-zinc-500 hover:border-zinc-500 dark:border-white/[.16] dark:text-zinc-400"
      >
        + Ajouter un média (placeholder, pas de téléversement réel)
      </button>
    </div>
  );
}

interface IdeaWorkshopViewProps {
  ideaId: string;
}

export function IdeaWorkshopView({ ideaId }: IdeaWorkshopViewProps) {
  const router = useRouter();
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
  const { accounts } = useAccountsSession();
  const { posts, addPosts, changeStatus } = usePostsSession();
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [isCreatingPublication, setIsCreatingPublication] = useState(false);

  const idea = ideas.find((candidate) => candidate.id === ideaId);

  if (!idea) {
    return (
      <div className="flex flex-col gap-4">
        <Link
          href="/banque-idees"
          className="w-fit text-sm font-medium text-zinc-500 hover:underline dark:text-zinc-400"
        >
          ← Retour à la banque d&apos;idées
        </Link>
        <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-400 dark:border-white/[.12] dark:text-zinc-600">
          Idée introuvable.
        </p>
      </div>
    );
  }

  const brand = brandProfiles.find((candidate) => candidate.id === idea.brandId);
  const theme = themes.find((candidate) => candidate.id === idea.themeId);
  const versions = contentVersions.filter((version) => version.ideaId === idea.id);

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
    versions
      .filter((v) => v.isCurrent)
      .forEach((v) => updateContentVersion(v.id, { ...v, isCurrent: false }));
    addContentVersion(version);
    updateIdea(idea!.id, { activeVersionId: version.id });
    setConfirmation("Nouvelle version enregistrée.");
  }

  function handleRestoreVersion(versionId: string) {
    const target = versions.find((v) => v.id === versionId);
    if (!target) return;
    const snapshot = buildVersionFromIdea(idea!, versions, "manual", "Avant restauration");
    versions
      .filter((v) => v.isCurrent)
      .forEach((v) => updateContentVersion(v.id, { ...v, isCurrent: false }));
    addContentVersion({ ...snapshot, isCurrent: false });
    setActiveContentVersion(idea!.id, target.id);
    updateIdea(idea!.id, { ...applyVersionToIdea(target), activeVersionId: target.id });
    setConfirmation(`« ${target.name || `Version ${target.versionNumber}`} » restaurée.`);
  }

  function handleDuplicateVersion(versionId: string) {
    const target = versions.find((v) => v.id === versionId);
    if (!target) return;
    addContentVersion(duplicateVersion(target, versions));
    setConfirmation("Version dupliquée.");
  }

  function handleDeleteVersion(versionId: string) {
    if (!window.confirm("Supprimer définitivement cette version ?")) return;
    removeContentVersion(versionId);
  }

  const currentVersion = versions.find((version) => version.isCurrent);

  function applyGeneratedVersion(version: ContentVersion) {
    versions.filter((v) => v.isCurrent).forEach((v) => updateContentVersion(v.id, { ...v, isCurrent: false }));
    addContentVersion(version);
    const patch: Partial<Idea> = { activeVersionId: version.id };
    if (version.format === "text") {
      Object.assign(patch, applyVersionToIdea(version));
    }
    updateIdea(idea!.id, patch);
  }

  function buildContext(tone: GenerationTone, length: GenerationLength, instructions: string): AIGenerationContext | null {
    if (!brand) return null;
    return { idea: idea!, brand, theme, tone, length, instructions };
  }

  function handleGenerateAI(params: { format: ContentFormat; tone: GenerationTone; length: GenerationLength; instructions: string }) {
    const context = buildContext(params.tone, params.length, params.instructions);
    if (!context) return;
    const version = buildAIVersion(context, params.format, versions);
    applyGeneratedVersion(version);
    setConfirmation("Contenu généré par IA (simulation).");
  }

  function handleRegenerateSection(section: TextSection, tone: GenerationTone, length: GenerationLength) {
    if (!currentVersion || currentVersion.format !== "text") return;
    const context = buildContext(tone, length, "");
    if (!context) return;
    const newBody = regenerateTextSection(currentVersion.body, section, context);
    const version = buildTransformedVersion(currentVersion, newBody, versions, "Section régénérée");
    applyGeneratedVersion(version);
    setConfirmation("Section régénérée.");
  }

  function handleShorten() {
    if (!currentVersion || currentVersion.format !== "text") return;
    const version = buildTransformedVersion(currentVersion, shortenText(currentVersion.body), versions, "Version raccourcie");
    applyGeneratedVersion(version);
  }

  function handleExpand() {
    if (!currentVersion || currentVersion.format !== "text") return;
    const context = buildContext("professional", "medium", "");
    if (!context) return;
    const version = buildTransformedVersion(currentVersion, expandText(currentVersion.body, context), versions, "Version développée");
    applyGeneratedVersion(version);
  }

  function handleSimplify() {
    if (!currentVersion || currentVersion.format !== "text") return;
    const version = buildTransformedVersion(currentVersion, simplifyText(currentVersion.body), versions, "Version simplifiée");
    applyGeneratedVersion(version);
  }

  function handleChangeTone(tone: GenerationTone) {
    if (!currentVersion || currentVersion.format !== "text") return;
    const context = buildContext(tone, "medium", "");
    if (!context) return;
    const version = buildTransformedVersion(currentVersion, changeTone(currentVersion.body, tone, context), versions, "Ton modifié");
    applyGeneratedVersion(version);
  }

  function handleAdaptForPlatform(platform: SocialPlatform) {
    if (!currentVersion || currentVersion.format !== "text") return;
    const version = buildTransformedVersion(
      currentVersion,
      adaptForPlatform(currentVersion.body, platform),
      versions,
      `Adaptée pour ${PLATFORM_LABEL[platform]}`
    );
    applyGeneratedVersion(version);
    set("platform", platform);
  }

  function handleCreatePublication() {
    if (!idea!.platform || isCreatingPublication) return;
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

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/banque-idees"
        className="w-fit text-sm font-medium text-zinc-500 hover:underline dark:text-zinc-400"
      >
        ← Retour à la banque d&apos;idées
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {idea.title || "Sans titre"}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <span>{brand?.name ?? idea.brandId}</span>
            {theme && <span>· {theme.label}</span>}
          </div>
        </div>
        {idea.publicationId ? (
          <Link
            href={`/publications/${idea.publicationId}`}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-white/[.1] dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
          >
            Voir la publication
          </Link>
        ) : (
          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              onClick={handleCreatePublication}
              disabled={!idea.platform || isCreatingPublication}
              className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40 disabled:cursor-not-allowed disabled:opacity-40 dark:shadow-fuchsia-500/10"
            >
              Créer une publication
            </button>
            {!idea.platform && (
              <span className="text-xs text-zinc-400 dark:text-zinc-600">
                Sélectionnez un réseau dans les détails avant de créer une publication.
              </span>
            )}
          </div>
        )}
      </div>

      {confirmation && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          {confirmation}
        </p>
      )}

      <IdeaWorkshopSection title="Détails">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Statut
            <select
              value={idea.status}
              onChange={(event) => handleChangeStatus(event.target.value as IdeaStatus)}
              className={FIELD_CLASS}
            >
              {IDEA_STATUS_ORDER.map((status) => (
                <option key={status} value={status}>
                  {IDEA_STATUS_LABEL[status]}
                </option>
              ))}
            </select>
            <span className={`w-fit rounded-full px-2 py-0.5 text-xs font-medium ${IDEA_STATUS_STYLE[idea.status]}`}>
              {IDEA_STATUS_LABEL[idea.status]}
            </span>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Réseau
            <select
              value={idea.platform ?? ""}
              onChange={(event) => set("platform", (event.target.value || undefined) as SocialPlatform | undefined)}
              className={FIELD_CLASS}
            >
              <option value="">Non défini</option>
              {ALL_PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {PLATFORM_LABEL[platform]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Format
            <select
              value={idea.format ?? ""}
              onChange={(event) => set("format", (event.target.value || undefined) as ContentFormat | undefined)}
              className={FIELD_CLASS}
            >
              <option value="">Non défini</option>
              {CONTENT_FORMATS.map((format) => (
                <option key={format} value={format}>
                  {FORMAT_LABEL[format]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Priorité
            <select
              value={idea.priority ?? ""}
              onChange={(event) =>
                set("priority", (event.target.value || undefined) as ContentPriority | undefined)
              }
              className={FIELD_CLASS}
            >
              <option value="">Non définie</option>
              {ALL_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {PRIORITY_LABEL[priority]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Date prévue
            <input
              type="datetime-local"
              disabled={!idea.scheduledFor}
              value={idea.scheduledFor ? idea.scheduledFor.slice(0, 16) : ""}
              onChange={(event) => set("scheduledFor", event.target.value)}
              className={FIELD_CLASS}
            />
          </label>
          <label className="flex items-center gap-2 self-end text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={!idea.scheduledFor}
              onChange={(event) =>
                set("scheduledFor", event.target.checked ? undefined : new Date().toISOString().slice(0, 16))
              }
            />
            Sans date pour l&apos;instant
          </label>
        </div>
      </IdeaWorkshopSection>

      <IdeaWorkshopSection title="Réflexion">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Angle" value={idea.angle ?? ""} onChange={(v) => set("angle", v)} />
          <TextField label="Objectif" value={idea.objective ?? ""} onChange={(v) => set("objective", v)} />
          <TextField label="Public cible" value={idea.targetAudience ?? ""} onChange={(v) => set("targetAudience", v)} />
          <TextField label="Accroche (hook)" value={idea.hook ?? ""} onChange={(v) => set("hook", v)} />
        </div>
        <ListField
          label="Points principaux (un par ligne)"
          value={idea.keyPoints ?? []}
          onChange={(v) => set("keyPoints", v)}
        />
        <ListField label="Références (une par ligne)" value={idea.references ?? []} onChange={(v) => set("references", v)} />
        <TextField
          label="Notes personnelles"
          value={idea.personalNotes ?? ""}
          multiline
          onChange={(v) => set("personalNotes", v)}
        />
      </IdeaWorkshopSection>

      <IdeaWorkshopSection title="Plan">
        <TextField label="Plan du contenu" value={idea.contentPlan ?? ""} multiline onChange={(v) => set("contentPlan", v)} />
      </IdeaWorkshopSection>

      <IdeaWorkshopSection title="Rédaction">
        <TextField label="Corps du message" value={idea.body ?? ""} multiline onChange={(v) => set("body", v)} />
        <TextField label="Conclusion" value={idea.conclusion ?? ""} multiline onChange={(v) => set("conclusion", v)} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Appel à l'action" value={idea.cta ?? ""} onChange={(v) => set("cta", v)} />
          <TextField label="Premier commentaire" value={idea.firstComment ?? ""} onChange={(v) => set("firstComment", v)} />
        </div>
        <ListField label="Hashtags (un par ligne)" value={idea.hashtags ?? []} onChange={(v) => set("hashtags", v)} />
        <MediaField value={idea.media ?? []} onChange={(v) => set("media", v)} />
      </IdeaWorkshopSection>

      <IdeaWorkshopSection title="Notes internes">
        <TextField label="Notes internes" value={idea.internalNotes ?? ""} multiline onChange={(v) => set("internalNotes", v)} />
      </IdeaWorkshopSection>

      <AIGenerationPanel
        defaultFormat={idea.format ?? "text"}
        currentVersion={currentVersion}
        onGenerate={handleGenerateAI}
        onRegenerateSection={handleRegenerateSection}
        onShorten={handleShorten}
        onExpand={handleExpand}
        onSimplify={handleSimplify}
        onChangeTone={handleChangeTone}
        onAdaptForPlatform={handleAdaptForPlatform}
      />

      <ContentVersionsPanel
        versions={versions}
        onSaveNewVersion={handleSaveNewVersion}
        onRestore={handleRestoreVersion}
        onDuplicate={handleDuplicateVersion}
        onDelete={handleDeleteVersion}
      />
    </div>
  );
}
