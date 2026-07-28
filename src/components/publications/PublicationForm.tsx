"use client";

import type { ReactNode } from "react";
import { useAccountsSession } from "@/lib/accounts-store";
import { brandProfiles } from "@/lib/brand-profiles";
import { CONTENT_FORMATS, FORMAT_LABEL } from "@/lib/editorial-constants";
import { PLATFORM_LABEL, STATUS_LABEL } from "@/lib/post-status";
import { useTeamSession } from "@/lib/team-store";
import type { SocialPlatform } from "@/types/dashboard";
import type { Publication, PublicationMedia, PublicationStatus } from "@/types/publication";

const ALL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "x"];

const ALL_STATUSES: PublicationStatus[] = [
  "idea",
  "draft",
  "in_production",
  "in_review",
  "pending_client",
  "approved",
  "scheduled",
  "published",
  "failed",
  "rejected",
];

const TIME_ZONES = [
  "America/Toronto",
  "Europe/Paris",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Tokyo",
];

const INPUT_CLASS =
  "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-zinc-800 disabled:bg-background disabled:text-zinc-500   dark:text-zinc-200 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-500";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5  ">
      <h2 className="text-sm font-semibold text-foreground ">{title}</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function TextField({
  label,
  value,
  editable,
  multiline,
  onChange,
}: {
  label: string;
  value: string;
  editable: boolean;
  multiline?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
      {label}
      {multiline ? (
        <textarea
          rows={3}
          disabled={!editable}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={INPUT_CLASS}
        />
      ) : (
        <input
          disabled={!editable}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={INPUT_CLASS}
        />
      )}
    </label>
  );
}

function ListField({
  label,
  value,
  editable,
  onChange,
}: {
  label: string;
  value: string[];
  editable: boolean;
  onChange: (value: string[]) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
      {label}
      <textarea
        rows={2}
        disabled={!editable}
        value={value.join("\n")}
        placeholder="Une valeur par ligne"
        onChange={(event) => onChange(event.target.value.split("\n"))}
        className={INPUT_CLASS}
      />
    </label>
  );
}

function MediaField({
  value,
  editable,
  onChange,
}: {
  value: PublicationMedia[];
  editable: boolean;
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
    <div className="col-span-1 flex flex-col gap-2 md:col-span-2">
      {value.map((media) => (
        <div
          key={media.id}
          className="flex items-center gap-2 rounded-lg border border-border p-2 "
        >
          <select
            disabled={!editable}
            value={media.type}
            onChange={(event) => update(media.id, { type: event.target.value as PublicationMedia["type"] })}
            className={`${INPUT_CLASS} w-auto`}
          >
            <option value="image">Image</option>
            <option value="video">Vidéo</option>
          </select>
          <input
            disabled={!editable}
            value={media.label}
            placeholder="nom-du-fichier.jpg"
            onChange={(event) => update(media.id, { label: event.target.value })}
            className={INPUT_CLASS}
          />
          {editable && (
            <button
              type="button"
              onClick={() => remove(media.id)}
              className="shrink-0 text-xs font-medium text-red-500 hover:underline"
            >
              Supprimer
            </button>
          )}
        </div>
      ))}
      {value.length === 0 && !editable && (
        <p className="text-sm text-muted-foreground ">Aucun média associé.</p>
      )}
      {editable && (
        <button
          type="button"
          onClick={add}
          className="w-fit rounded-lg border border-dashed border-zinc-400 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-zinc-500 dark:border-white/[.16] "
        >
          + Ajouter un média (placeholder, pas de téléversement réel)
        </button>
      )}
    </div>
  );
}

interface PublicationFormProps {
  publication: Publication;
  editable: boolean;
  onChange: (publication: Publication) => void;
}

export function PublicationForm({ publication, editable, onChange }: PublicationFormProps) {
  const { accounts } = useAccountsSession();
  const { members } = useTeamSession();

  function set<K extends keyof Publication>(key: K, value: Publication[K]) {
    onChange({ ...publication, [key]: value });
  }

  function handleBrandChange(brandName: string) {
    const firstAccount =
      accounts.find((account) => account.brand === brandName && account.status === "connected") ??
      accounts.find((account) => account.brand === brandName);
    onChange({
      ...publication,
      brand: brandName,
      accountId: firstAccount?.id ?? "",
      platform: firstAccount?.platform ?? publication.platform,
    });
  }

  function handleAccountChange(accountId: string) {
    const account = accounts.find((candidate) => candidate.id === accountId);
    onChange({
      ...publication,
      accountId,
      platform: account?.platform ?? publication.platform,
    });
  }

  const accountsForBrand = accounts.filter(
    (account) =>
      account.brand === publication.brand &&
      (account.status === "connected" || account.id === publication.accountId)
  );

  const membersForBrand = members.filter(
    (member) => member.status === "active" && member.brands.includes(publication.brand)
  );

  function memberOptions(currentValue: string) {
    const currentIsExternal = currentValue !== "" && !membersForBrand.some((member) => member.name === currentValue);
    return (
      <>
        <option value="">Non assigné</option>
        {currentIsExternal && <option value={currentValue}>{currentValue} (hors accès marque)</option>}
        {membersForBrand.map((member) => (
          <option key={member.id} value={member.name}>
            {member.name}
          </option>
        ))}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Section title="Diffusion">
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Marque
          <select
            disabled={!editable}
            value={publication.brand}
            onChange={(event) => handleBrandChange(event.target.value)}
            className={INPUT_CLASS}
          >
            {brandProfiles.map((brand) => (
              <option key={brand.id} value={brand.name}>
                {brand.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Compte social concerné
          <select
            disabled={!editable}
            value={publication.accountId}
            onChange={(event) => handleAccountChange(event.target.value)}
            className={INPUT_CLASS}
          >
            {accountsForBrand.map((account) => (
              <option key={account.id} value={account.id}>
                {account.handle}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Réseau
          <select
            disabled={!editable}
            value={publication.platform}
            onChange={(event) => set("platform", event.target.value as SocialPlatform)}
            className={INPUT_CLASS}
          >
            {ALL_PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>
                {PLATFORM_LABEL[platform]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Date et heure
          <input
            type="datetime-local"
            disabled={!editable}
            value={publication.scheduledFor.slice(0, 16)}
            onChange={(event) => set("scheduledFor", event.target.value)}
            className={INPUT_CLASS}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Fuseau horaire
          <select
            disabled={!editable}
            value={publication.timeZone}
            onChange={(event) => set("timeZone", event.target.value)}
            className={INPUT_CLASS}
          >
            {TIME_ZONES.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </label>
      </Section>

      <Section title="Contenu éditorial">
        <TextField label="Thématique" value={publication.theme} editable={editable} onChange={(v) => set("theme", v)} />

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Format
          <select
            disabled={!editable}
            value={publication.format}
            onChange={(event) => set("format", event.target.value as Publication["format"])}
            className={INPUT_CLASS}
          >
            {CONTENT_FORMATS.map((format) => (
              <option key={format} value={format}>
                {FORMAT_LABEL[format]}
              </option>
            ))}
          </select>
        </label>

        <div className="md:col-span-2">
          <TextField
            label="Objectif"
            value={publication.objective}
            editable={editable}
            multiline
            onChange={(v) => set("objective", v)}
          />
        </div>

        <div className="md:col-span-2">
          <TextField
            label="Titre / extrait"
            value={publication.excerpt}
            editable={editable}
            onChange={(v) => set("excerpt", v)}
          />
        </div>

        <div className="md:col-span-2">
          <TextField
            label="Texte de la publication"
            value={publication.text}
            editable={editable}
            multiline
            onChange={(v) => set("text", v)}
          />
        </div>

        <TextField label="Appel à l'action" value={publication.cta} editable={editable} onChange={(v) => set("cta", v)} />
        <ListField
          label="Hashtags (un par ligne)"
          value={publication.hashtags}
          editable={editable}
          onChange={(v) => set("hashtags", v)}
        />

        <div className="md:col-span-2">
          <TextField
            label="Premier commentaire"
            value={publication.firstComment}
            editable={editable}
            multiline
            onChange={(v) => set("firstComment", v)}
          />
        </div>
      </Section>

      <Section title="Médias">
        <MediaField value={publication.media} editable={editable} onChange={(v) => set("media", v)} />
      </Section>

      <Section title="Suivi">
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Statut
          <select
            disabled={!editable}
            value={publication.status}
            onChange={(event) => set("status", event.target.value as PublicationStatus)}
            className={INPUT_CLASS}
          >
            {ALL_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABEL[status]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Responsable
          <select
            disabled={!editable}
            value={publication.owner}
            onChange={(event) => set("owner", event.target.value)}
            className={INPUT_CLASS}
          >
            {memberOptions(publication.owner)}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Approbateur
          <select
            disabled={!editable}
            value={publication.approver}
            onChange={(event) => set("approver", event.target.value)}
            className={INPUT_CLASS}
          >
            {memberOptions(publication.approver)}
          </select>
        </label>

        <div className="md:col-span-2">
          <TextField
            label="Notes internes"
            value={publication.internalNotes}
            editable={editable}
            multiline
            onChange={(v) => set("internalNotes", v)}
          />
        </div>
      </Section>
    </div>
  );
}
