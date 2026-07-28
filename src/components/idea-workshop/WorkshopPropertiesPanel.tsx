"use client";

import { useState } from "react";
import { TONE_LABEL, type GenerationTone } from "@/lib/assisted-generation";
import { CONTENT_FORMATS, FORMAT_LABEL } from "@/lib/editorial-constants";
import { IDEA_STATUS_LABEL, IDEA_STATUS_ORDER, IDEA_STATUS_STYLE, PRIORITY_LABEL } from "@/lib/idea-status";
import { PLATFORM_LABEL } from "@/lib/post-status";
import type { Campaign } from "@/types/campaign";
import type { SocialPlatform } from "@/types/dashboard";
import type { ContentFormat } from "@/types/editorial-calendar";
import type { Idea, IdeaStatus } from "@/types/idea";
import type { ContentPriority, PublicationMedia } from "@/types/publication";

const ALL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "x", "youtube"];
const ALL_PRIORITIES: ContentPriority[] = ["low", "medium", "high"];
const ALL_TONES: GenerationTone[] = [
  "professional",
  "friendly",
  "enthusiastic",
  "direct",
  "pedagogical",
  "inspiring",
  "conversational",
  "expert",
  "storytelling",
  "provocative",
];

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const FIELD_CLASS = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200";
const LABEL_CLASS = "flex flex-col gap-1 text-xs font-medium text-muted-foreground";

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className={LABEL_CLASS}>
      {label}
      <span className="rounded-lg bg-muted px-3 py-2 text-sm text-foreground">{value || "—"}</span>
    </div>
  );
}

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
    <label className={LABEL_CLASS}>
      {label}
      {multiline ? (
        <textarea rows={3} value={value} onChange={(event) => onChange(event.target.value)} className={FIELD_CLASS} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} className={FIELD_CLASS} />
      )}
    </label>
  );
}

function ListField({ label, value, onChange }: { label: string; value: string[]; onChange: (value: string[]) => void }) {
  return (
    <label className={LABEL_CLASS}>
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

function MediaField({ value, onChange }: { value: PublicationMedia[]; onChange: (value: PublicationMedia[]) => void }) {
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
        <div key={media.id} className="flex items-center gap-2 rounded-lg border border-border p-2">
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
          <button type="button" onClick={() => remove(media.id)} className="shrink-0 text-xs font-medium text-red-500 hover:underline">
            Supprimer
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="w-fit rounded-lg border border-dashed border-zinc-400 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-zinc-500 dark:border-white/[.16]"
      >
        + Ajouter un média (aperçu uniquement, pas de téléversement réel)
      </button>
    </div>
  );
}

interface WorkshopPropertiesPanelProps {
  idea: Idea;
  brandLabel: string;
  themeLabel?: string;
  campaigns: Campaign[];
  onFieldChange: <K extends keyof Idea>(key: K, value: Idea[K]) => void;
  onStatusChange: (status: IdeaStatus) => void;
}

/**
 * Onglet « Propriétés » du panneau latéral droit — reprend l'ensemble des champs de l'ancien
 * Atelier (Détails, Réflexion, Rédaction annexe, Notes internes), simplement réorganisés pour ne
 * plus surcharger la feuille de rédaction centrale. Aucun champ n'a été supprimé.
 */
export function WorkshopPropertiesPanel({ idea, brandLabel, themeLabel, campaigns, onFieldChange, onStatusChange }: WorkshopPropertiesPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const relevantCampaigns = campaigns.filter((campaign) => campaign.brandId === idea.brandId);

  return (
    <div className="flex flex-col gap-4">
      <div className={LABEL_CLASS}>
        Statut
        <select value={idea.status} onChange={(event) => onStatusChange(event.target.value as IdeaStatus)} className={FIELD_CLASS}>
          {IDEA_STATUS_ORDER.map((status) => (
            <option key={status} value={status}>
              {IDEA_STATUS_LABEL[status]}
            </option>
          ))}
        </select>
        <span className={`w-fit rounded-full px-2 py-0.5 text-xs font-medium ${IDEA_STATUS_STYLE[idea.status]}`}>
          {IDEA_STATUS_LABEL[idea.status]}
        </span>
      </div>

      <ReadOnlyField label="Marque" value={brandLabel} />
      <ReadOnlyField label="Thématique" value={themeLabel ?? "Sans thématique"} />

      <label className={LABEL_CLASS}>
        Réseau
        <select
          value={idea.platform ?? ""}
          onChange={(event) => onFieldChange("platform", (event.target.value || undefined) as SocialPlatform | undefined)}
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

      <label className={LABEL_CLASS}>
        Format
        <select
          value={idea.format ?? ""}
          onChange={(event) => onFieldChange("format", (event.target.value || undefined) as ContentFormat | undefined)}
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

      <TextField label="Objectif" value={idea.objective ?? ""} onChange={(value) => onFieldChange("objective", value)} />
      <TextField label="Public cible" value={idea.targetAudience ?? ""} onChange={(value) => onFieldChange("targetAudience", value)} />

      <label className={LABEL_CLASS}>
        Ton
        <select
          value={idea.tone ?? ""}
          onChange={(event) => onFieldChange("tone", (event.target.value || undefined) as GenerationTone | undefined)}
          className={FIELD_CLASS}
        >
          <option value="">Non défini</option>
          {ALL_TONES.map((tone) => (
            <option key={tone} value={tone}>
              {TONE_LABEL[tone]}
            </option>
          ))}
        </select>
      </label>

      <label className={LABEL_CLASS}>
        Priorité
        <select
          value={idea.priority ?? ""}
          onChange={(event) => onFieldChange("priority", (event.target.value || undefined) as ContentPriority | undefined)}
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

      <label className={LABEL_CLASS}>
        Campagne
        <select
          value={idea.campaignId ?? ""}
          onChange={(event) => onFieldChange("campaignId", event.target.value || undefined)}
          className={FIELD_CLASS}
        >
          <option value="">Aucune</option>
          {relevantCampaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.name}
            </option>
          ))}
        </select>
      </label>

      <div className={LABEL_CLASS}>
        Date prévue
        <input
          type="datetime-local"
          disabled={!idea.scheduledFor}
          value={idea.scheduledFor ? idea.scheduledFor.slice(0, 16) : ""}
          onChange={(event) => onFieldChange("scheduledFor", event.target.value)}
          className={FIELD_CLASS}
        />
        <label className="flex items-center gap-2 text-xs font-normal text-foreground">
          <input
            type="checkbox"
            checked={!idea.scheduledFor}
            onChange={(event) => onFieldChange("scheduledFor", event.target.checked ? undefined : new Date().toISOString().slice(0, 16))}
          />
          Sans date pour l&apos;instant
        </label>
      </div>

      <TextField label="Responsable" value={idea.owner ?? ""} onChange={(value) => onFieldChange("owner", value)} />

      <ReadOnlyField label="Source" value={idea.source === "generated" ? "Générée" : "Manuelle"} />
      <ReadOnlyField label="Date de création" value={dateFormatter.format(new Date(idea.createdAt))} />
      <ReadOnlyField label="Dernière modification" value={dateFormatter.format(new Date(idea.updatedAt))} />

      <button
        type="button"
        onClick={() => setShowAdvanced((prev) => !prev)}
        aria-expanded={showAdvanced}
        className="mt-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
      >
        {showAdvanced ? "Masquer les détails avancés" : "Afficher les détails avancés"}
      </button>

      {showAdvanced && (
        <div className="flex flex-col gap-4 border-t border-border pt-4">
          <TextField label="Angle" value={idea.angle ?? ""} onChange={(value) => onFieldChange("angle", value)} />
          <ListField label="Points principaux (un par ligne)" value={idea.keyPoints ?? []} onChange={(value) => onFieldChange("keyPoints", value)} />
          <ListField label="Références (une par ligne)" value={idea.references ?? []} onChange={(value) => onFieldChange("references", value)} />
          <TextField label="Notes personnelles" value={idea.personalNotes ?? ""} multiline onChange={(value) => onFieldChange("personalNotes", value)} />
          <TextField label="Conclusion" value={idea.conclusion ?? ""} multiline onChange={(value) => onFieldChange("conclusion", value)} />
          <ListField label="Hashtags (un par ligne)" value={idea.hashtags ?? []} onChange={(value) => onFieldChange("hashtags", value)} />
          <TextField label="Premier commentaire" value={idea.firstComment ?? ""} onChange={(value) => onFieldChange("firstComment", value)} />
          <div className={LABEL_CLASS}>
            Médias
            <MediaField value={idea.media ?? []} onChange={(value) => onFieldChange("media", value)} />
          </div>
          <TextField label="Notes internes" value={idea.internalNotes ?? ""} multiline onChange={(value) => onFieldChange("internalNotes", value)} />
        </div>
      )}
    </div>
  );
}
