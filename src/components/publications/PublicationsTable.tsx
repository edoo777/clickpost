"use client";

import { useMemo, useRef, useState } from "react";
import { MediaCell } from "@/components/publications/table/MediaCell";
import { getMatchingPerformedPublications } from "@/lib/analytics-report";
import { useBrandsSession } from "@/lib/brands-store";
import { useCampaignsSession } from "@/lib/campaigns-store";
import { isDemoAnalyticsEnabled } from "@/lib/demo-data-preference";
import { CONTENT_FORMATS, useFormatLabel } from "@/lib/editorial-constants";
import { useTranslations } from "@/lib/i18n/locale-provider";
import { useImportedMetricsSession } from "@/lib/imported-metrics-store";
import { buildNewPost } from "@/lib/posts";
import { usePlatformLabel, useStatusLabel } from "@/lib/post-status";
import { usePostsSession } from "@/lib/posts-store";
import { useTeamSession } from "@/lib/team-store";
import { useWorkspaceSession } from "@/lib/supabase/workspace-provider";
import type { SavedViewSort } from "@/types/saved-view";
import type { Publication, PublicationStatus } from "@/types/publication";
import type { SocialPlatform } from "@/types/dashboard";

const ALL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "x"];
const ALL_STATUSES: PublicationStatus[] = [
  "idea",
  "to_develop",
  "content_generated",
  "draft",
  "in_production",
  "in_review",
  "needs_changes",
  "pending_client",
  "approved",
  "ready_to_schedule",
  "scheduled",
  "published",
  "failed",
  "rejected",
  "archived",
];

/** Couleurs légères disponibles pour un en-tête de colonne — volontairement peu nombreuses et
 * pastel (jamais une palette criarde façon tableur multicolore, voir la consigne explicite).
 * `swatchStyle` sert uniquement au petit rond de sélection dans le panneau (toujours identique,
 * quel que soit le thème) ; `headerClass` habille réellement l'en-tête, clair/sombre inclus,
 * même convention que le reste de l'application (jamais une couleur calculée en JS). */
const HEADER_COLOR_OPTIONS: { key: string; swatchStyle: string; headerClass: string }[] = [
  { key: "violet", swatchStyle: "#f3e8ff", headerClass: "bg-violet-50 dark:bg-violet-500/10" },
  { key: "blue", swatchStyle: "#e0f2fe", headerClass: "bg-sky-50 dark:bg-sky-500/10" },
  { key: "green", swatchStyle: "#dcfce7", headerClass: "bg-emerald-50 dark:bg-emerald-500/10" },
  { key: "amber", swatchStyle: "#fef3c7", headerClass: "bg-amber-50 dark:bg-amber-500/10" },
  { key: "rose", swatchStyle: "#ffe4e6", headerClass: "bg-rose-50 dark:bg-rose-500/10" },
];

interface ColumnDef {
  key: string;
  label: string;
  defaultWidth: number;
  sortProperty?: string;
}

const CELL_CLASS =
  "w-full min-w-0 rounded border border-transparent bg-transparent px-1.5 py-1 text-sm text-zinc-700 hover:border-border focus:border-violet-400 focus:bg-white focus:outline-none dark:text-zinc-300 dark:focus:bg-zinc-900";

interface PublicationsTableProps {
  publications: Publication[];
  visibleProperties: string[];
  onChangeVisibleProperties: (properties: string[]) => void;
  columnWidths: Record<string, number>;
  onChangeColumnWidths: (widths: Record<string, number>) => void;
  columnColors: Record<string, string>;
  onChangeColumnColors: (colors: Record<string, string>) => void;
  onResetColumns: () => void;
  sorting: SavedViewSort[];
  onChangeSorting: (sorting: SavedViewSort[]) => void;
  onOpen: (id: string) => void;
}

export function PublicationsTable({
  publications,
  visibleProperties,
  onChangeVisibleProperties,
  columnWidths,
  onChangeColumnWidths,
  columnColors,
  onChangeColumnColors,
  onResetColumns,
  sorting,
  onChangeSorting,
  onOpen,
}: PublicationsTableProps) {
  const t = useTranslations();
  const { patchPost, duplicatePost, changeStatus, removePost, addPosts } = usePostsSession();
  const { brands } = useBrandsSession();
  const { campaigns } = useCampaignsSession();
  const { members, currentUserId } = useTeamSession();
  const { workspace } = useWorkspaceSession();
  const { importedMetrics } = useImportedMetricsSession();
  const currentUserName = members.find((member) => member.id === currentUserId)?.name ?? "";
  const PLATFORM_LABEL = usePlatformLabel();
  const STATUS_LABEL = useStatusLabel();
  const FORMAT_LABEL = useFormatLabel();

  const COLUMNS: ColumnDef[] = [
    { key: "excerpt", label: t("publications.table.columns.title"), defaultWidth: 200, sortProperty: "excerpt" },
    { key: "text", label: t("publications.table.columns.content"), defaultWidth: 220 },
    { key: "media", label: t("publications.table.columns.media"), defaultWidth: 70 },
    { key: "brand", label: t("publications.form.brand"), defaultWidth: 140, sortProperty: "brand" },
    { key: "platform", label: t("publications.form.network"), defaultWidth: 120, sortProperty: "platform" },
    { key: "date", label: t("publications.table.columns.date"), defaultWidth: 130, sortProperty: "scheduledFor" },
    { key: "time", label: t("publications.table.columns.time"), defaultWidth: 90 },
    { key: "status", label: t("publications.promotion.status"), defaultWidth: 160, sortProperty: "status" },
    { key: "format", label: t("publications.form.format"), defaultWidth: 130, sortProperty: "format" },
    { key: "theme", label: t("publications.form.theme"), defaultWidth: 150, sortProperty: "theme" },
    { key: "objective", label: t("publications.form.objective"), defaultWidth: 180 },
    { key: "owner", label: t("publications.promotion.owner"), defaultWidth: 150, sortProperty: "owner" },
    { key: "campaign", label: t("publications.table.columns.campaign"), defaultWidth: 150 },
    { key: "performance", label: t("publications.table.columns.performance"), defaultWidth: 110 },
  ];

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isColumnsOpen, setIsColumnsOpen] = useState(false);
  const [bulkPanel, setBulkPanel] = useState<"none" | "status" | "date" | "owner">("none");
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const resizeRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);

  // Un changement de filtre ne doit jamais laisser une action groupée s'appliquer à une
  // publication devenue invisible : on retire de la sélection tout identifiant qui n'apparaît
  // plus dans la liste affichée, dès que cette liste change (ajustement pendant le rendu, pas
  // dans un effet — cf. react-hooks/set-state-in-effect déjà évité ainsi ailleurs dans ce module).
  const visibleIdsKey = publications.map((post) => post.id).join(",");
  const [lastVisibleIdsKey, setLastVisibleIdsKey] = useState(visibleIdsKey);
  if (visibleIdsKey !== lastVisibleIdsKey) {
    setLastVisibleIdsKey(visibleIdsKey);
    const visibleIds = new Set(publications.map((post) => post.id));
    const pruned = new Set([...selected].filter((id) => visibleIds.has(id)));
    if (pruned.size !== selected.size) setSelected(pruned);
  }

  const orderedColumns = visibleProperties
    .map((key) => COLUMNS.find((column) => column.key === key))
    .filter((column): column is ColumnDef => Boolean(column));

  // Performance résolue une seule fois pour les publications affichées — jamais de donnée
  // inventée : absente (case "—") tant qu'aucun import réel ni mode démonstration ne la fournit
  // (voir analytics-report.ts, même moteur que la page Performances).
  const performanceById = useMemo(() => {
    const matched = getMatchingPerformedPublications(
      publications,
      { brand: "all", accountId: "all", platform: "all", startDate: "0000-01-01", endDate: "9999-12-31" },
      importedMetrics,
      isDemoAnalyticsEnabled()
    );
    return new Map(matched.map((entry) => [entry.id, entry]));
  }, [publications, importedMetrics]);

  function widthOf(column: ColumnDef) {
    return columnWidths[column.key] ?? column.defaultWidth;
  }

  function startResize(event: React.MouseEvent, column: ColumnDef) {
    event.preventDefault();
    resizeRef.current = { key: column.key, startX: event.clientX, startWidth: widthOf(column) };
    function handleMove(moveEvent: MouseEvent) {
      if (!resizeRef.current) return;
      const delta = moveEvent.clientX - resizeRef.current.startX;
      const next = Math.max(70, resizeRef.current.startWidth + delta);
      onChangeColumnWidths({ ...columnWidths, [resizeRef.current.key]: next });
    }
    function handleUp() {
      resizeRef.current = null;
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    }
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  }

  function toggleColumn(key: string) {
    if (visibleProperties.includes(key)) {
      onChangeVisibleProperties(visibleProperties.filter((candidate) => candidate !== key));
    } else {
      onChangeVisibleProperties([...visibleProperties, key]);
    }
  }

  function moveColumn(key: string, direction: -1 | 1) {
    const index = visibleProperties.indexOf(key);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= visibleProperties.length) return;
    const next = [...visibleProperties];
    [next[index], next[target]] = [next[target], next[index]];
    onChangeVisibleProperties(next);
  }

  /** Glisser-déposer réel sur les en-têtes — réordonne le même tableau que les flèches du
   * panneau « Colonnes » (une seule source de vérité, `visibleProperties`), jamais un second
   * mécanisme parallèle. */
  function reorderColumnByDrag(fromKey: string, toKey: string) {
    if (fromKey === toKey) return;
    const fromIndex = visibleProperties.indexOf(fromKey);
    const toIndex = visibleProperties.indexOf(toKey);
    if (fromIndex === -1 || toIndex === -1) return;
    const next = [...visibleProperties];
    next.splice(fromIndex, 1);
    next.splice(toIndex, 0, fromKey);
    onChangeVisibleProperties(next);
  }

  function setColumnColor(key: string, colorKey: string | null) {
    const next = { ...columnColors };
    if (colorKey) next[key] = colorKey;
    else delete next[key];
    onChangeColumnColors(next);
  }

  function headerColorClass(column: ColumnDef): string {
    const colorKey = columnColors[column.key];
    return HEADER_COLOR_OPTIONS.find((candidate) => candidate.key === colorKey)?.headerClass ?? "";
  }

  function toggleSort(column: ColumnDef) {
    if (!column.sortProperty) return;
    const current = sorting[0];
    if (!current || current.property !== column.sortProperty) {
      onChangeSorting([{ property: column.sortProperty, direction: "asc" }]);
    } else if (current.direction === "asc") {
      onChangeSorting([{ property: column.sortProperty, direction: "desc" }]);
    } else {
      onChangeSorting([]);
    }
  }

  function toggleSelectAll() {
    setSelected((prev) => (prev.size === publications.length ? new Set() : new Set(publications.map((p) => p.id))));
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function closeBulkPanels() {
    setBulkPanel("none");
  }

  function bulkDuplicate() {
    selected.forEach((id) => duplicatePost(id));
    setSelected(new Set());
  }

  function bulkArchive() {
    selected.forEach((id) => changeStatus(id, "archived", currentUserName));
    setSelected(new Set());
  }

  function bulkDelete() {
    if (!window.confirm(t("publications.table.confirmBulkDelete", { count: selected.size, plural: selected.size > 1 ? "s" : "" }))) return;
    selected.forEach((id) => removePost(id));
    setSelected(new Set());
  }

  function bulkSetStatus(status: PublicationStatus) {
    selected.forEach((id) => changeStatus(id, status, currentUserName));
    setSelected(new Set());
    closeBulkPanels();
  }

  function bulkSetDate(dateValue: string) {
    if (!dateValue) return;
    selected.forEach((id) => {
      const post = publications.find((candidate) => candidate.id === id);
      const time = post ? post.scheduledFor.slice(11, 16) || "09:00" : "09:00";
      patchPost(id, { scheduledFor: `${dateValue}T${time}:00` });
    });
    setSelected(new Set());
    closeBulkPanels();
  }

  function bulkSetOwner(owner: string) {
    selected.forEach((id) => patchPost(id, { owner }));
    setSelected(new Set());
    closeBulkPanels();
  }

  function membersForBrand(brandName: string) {
    return members.filter((member) => member.status === "active" && member.brands.includes(brandName));
  }

  function handleQuickAdd() {
    const defaultBrand = brands[0]?.name ?? "";
    const now = new Date();
    now.setMinutes(0, 0, 0);
    const post = buildNewPost({
      brand: defaultBrand,
      platform: ALL_PLATFORMS[0],
      format: "text",
      excerpt: "",
      scheduledFor: now.toISOString(),
    });
    addPosts([post]);
  }

  function renderCell(post: Publication, column: ColumnDef) {
    switch (column.key) {
      case "excerpt":
        return (
          <input
            className={CELL_CLASS}
            value={post.excerpt}
            onChange={(event) => patchPost(post.id, { excerpt: event.target.value })}
            placeholder={t("publications.card.untitled")}
          />
        );
      case "text":
        return (
          <input
            className={CELL_CLASS}
            value={post.text}
            onChange={(event) => patchPost(post.id, { text: event.target.value })}
            placeholder={post.excerpt || t("publications.table.empty")}
          />
        );
      case "brand":
        return (
          <select
            className={CELL_CLASS}
            value={post.brand}
            onChange={(event) => patchPost(post.id, { brand: event.target.value })}
          >
            {brands.map((brand) => (
              <option key={brand.id} value={brand.name}>
                {brand.name}
              </option>
            ))}
          </select>
        );
      case "platform":
        return (
          <select
            className={CELL_CLASS}
            value={post.platform}
            onChange={(event) => patchPost(post.id, { platform: event.target.value as SocialPlatform })}
          >
            {ALL_PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>
                {PLATFORM_LABEL[platform]}
              </option>
            ))}
          </select>
        );
      case "date":
        return (
          <input
            type="date"
            className={CELL_CLASS}
            value={post.scheduledFor.slice(0, 10)}
            onChange={(event) => {
              const time = post.scheduledFor.slice(11, 16) || "09:00";
              patchPost(post.id, { scheduledFor: `${event.target.value}T${time}:00` });
            }}
          />
        );
      case "time":
        return (
          <input
            type="time"
            className={CELL_CLASS}
            value={post.scheduledFor.slice(11, 16)}
            onChange={(event) => {
              const date = post.scheduledFor.slice(0, 10);
              patchPost(post.id, { scheduledFor: `${date}T${event.target.value}:00` });
            }}
          />
        );
      case "status":
        return (
          <select
            className={CELL_CLASS}
            value={post.status}
            onChange={(event) => changeStatus(post.id, event.target.value as PublicationStatus, currentUserName)}
          >
            {ALL_STATUSES.map((status) => (
              <option
                key={status}
                value={status}
                disabled={
                  (status === "approved" && post.status !== "approved") ||
                  (status === "published" && post.status !== "published") ||
                  (status === "scheduled" && !["approved", "ready_to_schedule", "scheduled", "failed"].includes(post.status))
                }
              >
                {STATUS_LABEL[status]}
              </option>
            ))}
          </select>
        );
      case "format":
        return (
          <select
            className={CELL_CLASS}
            value={post.format}
            onChange={(event) => patchPost(post.id, { format: event.target.value as Publication["format"] })}
          >
            {CONTENT_FORMATS.map((format) => (
              <option key={format} value={format}>
                {FORMAT_LABEL[format]}
              </option>
            ))}
          </select>
        );
      case "theme":
        return (
          <input
            className={CELL_CLASS}
            value={post.theme}
            onChange={(event) => patchPost(post.id, { theme: event.target.value })}
          />
        );
      case "objective":
        return (
          <input
            className={CELL_CLASS}
            value={post.objective}
            onChange={(event) => patchPost(post.id, { objective: event.target.value })}
          />
        );
      case "owner": {
        const options = membersForBrand(post.brand);
        const currentIsExternal = post.owner !== "" && !options.some((member) => member.name === post.owner);
        return (
          <select
            className={CELL_CLASS}
            value={post.owner}
            onChange={(event) => patchPost(post.id, { owner: event.target.value })}
          >
            <option value="">{t("publications.card.unassigned")}</option>
            {currentIsExternal && <option value={post.owner}>{post.owner}</option>}
            {options.map((member) => (
              <option key={member.id} value={member.name}>
                {member.name}
              </option>
            ))}
          </select>
        );
      }
      case "campaign": {
        const brandId = brands.find((brand) => brand.name === post.brand)?.id;
        const options = campaigns.filter((campaign) => campaign.brandId === brandId);
        if (options.length === 0 && !post.campaignId) {
          return <span className="block px-1.5 py-1 text-sm text-muted-foreground">—</span>;
        }
        return (
          <select
            className={CELL_CLASS}
            value={post.campaignId ?? ""}
            onChange={(event) => patchPost(post.id, { campaignId: event.target.value || undefined })}
          >
            <option value="">{t("publications.table.noCampaign")}</option>
            {options.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
        );
      }
      case "performance": {
        const performed = performanceById.get(post.id);
        if (!performed) return <span className="block px-1.5 py-1 text-sm text-muted-foreground">—</span>;
        return (
          <span
            className="block px-1.5 py-1 text-sm font-medium text-zinc-700 dark:text-zinc-300"
            title={performed.performance.source === "demo" ? t("publications.table.performanceDemoHint") : undefined}
          >
            {performed.engagementRate.toFixed(1)}%{performed.performance.source === "demo" ? " ·" : ""}
          </span>
        );
      }
      case "media":
        return (
          <MediaCell
            workspaceId={workspace?.id}
            brandId={brands.find((brand) => brand.name === post.brand)?.id}
            publicationId={post.id}
            media={post.media}
            editable
            onChange={(media) => patchPost(post.id, { media })}
          />
        );
      default:
        return null;
    }
  }

  const hasSelection = selected.size > 0;
  const canOpenSelection = selected.size === 1;

  function openSelected() {
    if (!canOpenSelection) return;
    const [id] = selected;
    onOpen(id);
  }

  const allBulkOwnerOptions = Array.from(new Set(members.filter((member) => member.status === "active").map((member) => member.name)));

  return (
    <div className="flex flex-col gap-2">
      <div
        className={`flex flex-wrap items-center justify-between gap-2 ${
          hasSelection ? "sticky top-0 z-30 -mx-1 rounded-lg bg-surface/95 px-1 py-1.5 shadow-sm backdrop-blur-sm dark:bg-surface/90" : ""
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          {hasSelection && (
            <>
              <span className="text-xs font-medium text-muted-foreground ">
                {t("publications.table.selectedCount", { count: selected.size, plural: selected.size > 1 ? "s" : "" })}
              </span>
              <div className="group relative">
                <button
                  type="button"
                  onClick={openSelected}
                  aria-disabled={!canOpenSelection}
                  aria-describedby={!canOpenSelection ? "table-open-selection-hint" : undefined}
                  className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    canOpenSelection
                      ? "border-border text-zinc-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
                      : "cursor-not-allowed border-border text-zinc-300 dark:border-white/[.08] dark:text-zinc-600"
                  }`}
                >
                  {t("publications.table.open")}
                </button>
                {!canOpenSelection && (
                  <span
                    id="table-open-selection-hint"
                    role="tooltip"
                    className="pointer-events-none absolute left-0 top-full z-50 mt-1 w-max max-w-[220px] rounded-lg border border-border bg-surface-elevated px-2.5 py-1.5 text-xs font-medium text-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                  >
                    {t("publications.table.selectOneHint")}
                  </span>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setBulkPanel((prev) => (prev === "status" ? "none" : "status"))}
                  className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
                >
                  {t("publications.table.bulkChangeStatus")}
                </button>
                {bulkPanel === "status" && (
                  <div className="absolute left-0 top-full z-50 mt-1 max-h-64 w-56 overflow-y-auto rounded-xl border border-border bg-surface-elevated p-1.5 shadow-xl">
                    {ALL_STATUSES.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => bulkSetStatus(status)}
                        className="block w-full rounded-lg px-3 py-1.5 text-left text-sm text-foreground hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
                      >
                        {STATUS_LABEL[status]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setBulkPanel((prev) => (prev === "date" ? "none" : "date"))}
                  className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
                >
                  {t("publications.table.bulkChangeDate")}
                </button>
                {bulkPanel === "date" && (
                  <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-xl border border-border bg-surface-elevated p-2 shadow-xl">
                    <input
                      type="date"
                      autoFocus
                      onChange={(event) => bulkSetDate(event.target.value)}
                      className="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-zinc-700 dark:text-zinc-300"
                    />
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setBulkPanel((prev) => (prev === "owner" ? "none" : "owner"))}
                  className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
                >
                  {t("publications.table.bulkChangeOwner")}
                </button>
                {bulkPanel === "owner" && (
                  <div className="absolute left-0 top-full z-50 mt-1 max-h-64 w-56 overflow-y-auto rounded-xl border border-border bg-surface-elevated p-1.5 shadow-xl">
                    <button
                      type="button"
                      onClick={() => bulkSetOwner("")}
                      className="block w-full rounded-lg px-3 py-1.5 text-left text-sm text-foreground hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
                    >
                      {t("publications.card.unassigned")}
                    </button>
                    {allBulkOwnerOptions.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => bulkSetOwner(name)}
                        className="block w-full rounded-lg px-3 py-1.5 text-left text-sm text-foreground hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={bulkArchive}
                className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
              >
                {t("publications.table.archive")}
              </button>
              <button
                type="button"
                onClick={bulkDuplicate}
                className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700  dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
              >
                {t("publications.table.duplicate")}
              </button>
              <button
                type="button"
                onClick={bulkDelete}
                className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                {t("common.delete")}
              </button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted "
              >
                {t("publications.table.cancelSelection")}
              </button>
            </>
          )}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsColumnsOpen((prev) => !prev)}
            className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-muted  dark:text-zinc-400"
          >
            {t("publications.table.columnsButton")}
          </button>
          {isColumnsOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-72 rounded-xl border border-border bg-surface-elevated p-2 shadow-xl">
              {COLUMNS.map((column) => {
                const isVisible = visibleProperties.includes(column.key);
                const activeColor = columnColors[column.key];
                return (
                  <div key={column.key} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted ">
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={() => toggleColumn(column.key)}
                      aria-label={t("publications.table.showColumn", { label: column.label })}
                    />
                    <span className="flex-1 truncate text-sm text-foreground ">{column.label}</span>
                    {isVisible && (
                      <>
                        <div className="flex items-center gap-0.5">
                          {HEADER_COLOR_OPTIONS.map((option) => (
                            <button
                              key={option.key}
                              type="button"
                              onClick={() => setColumnColor(column.key, activeColor === option.key ? null : option.key)}
                              aria-label={t("publications.table.setColumnColor", { label: column.label })}
                              aria-pressed={activeColor === option.key}
                              className={`h-4 w-4 rounded-full border ${activeColor === option.key ? "border-zinc-900 dark:border-white" : "border-border"}`}
                              style={{ backgroundColor: option.swatchStyle }}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => moveColumn(column.key, -1)}
                            aria-label={t("publications.table.moveColumnLeft", { label: column.label })}
                            className="rounded px-1 text-xs text-muted-foreground hover:bg-white dark:hover:bg-zinc-800"
                          >
                            ←
                          </button>
                          <button
                            type="button"
                            onClick={() => moveColumn(column.key, 1)}
                            aria-label={t("publications.table.moveColumnRight", { label: column.label })}
                            className="rounded px-1 text-xs text-muted-foreground hover:bg-white dark:hover:bg-zinc-800"
                          >
                            →
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
              <div className="mt-1 border-t border-border pt-1.5">
                <button
                  type="button"
                  onClick={onResetColumns}
                  className="w-full rounded-lg px-2 py-1.5 text-left text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  {t("publications.table.resetColumns")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface  ">
        <table className="text-left text-sm" style={{ tableLayout: "fixed", width: "max-content", minWidth: "100%" }}>
          <colgroup>
            <col style={{ width: 36 }} />
            {orderedColumns.map((column) => (
              <col key={column.key} style={{ width: widthOf(column) }} />
            ))}
            <col style={{ width: 44 }} />
          </colgroup>
          <thead>
            <tr className="border-b-2 border-border text-xs font-semibold uppercase tracking-wide text-muted-foreground  ">
              <th className="px-2 py-2.5">
                <input
                  type="checkbox"
                  checked={selected.size > 0 && selected.size === publications.length}
                  onChange={toggleSelectAll}
                  aria-label={t("publications.table.selectAll")}
                />
              </th>
              {orderedColumns.map((column) => {
                const activeSort = sorting[0]?.property === column.sortProperty ? sorting[0] : undefined;
                return (
                  <th
                    key={column.key}
                    draggable
                    onDragStart={() => setDraggedKey(column.key)}
                    onDragOver={(event) => {
                      event.preventDefault();
                      if (dragOverKey !== column.key) setDragOverKey(column.key);
                    }}
                    onDragLeave={() => setDragOverKey((prev) => (prev === column.key ? null : prev))}
                    onDrop={(event) => {
                      event.preventDefault();
                      if (draggedKey) reorderColumnByDrag(draggedKey, column.key);
                      setDraggedKey(null);
                      setDragOverKey(null);
                    }}
                    onDragEnd={() => {
                      setDraggedKey(null);
                      setDragOverKey(null);
                    }}
                    className={`relative cursor-grab select-none px-2 py-2.5 active:cursor-grabbing ${headerColorClass(column)} ${
                      dragOverKey === column.key && draggedKey && draggedKey !== column.key
                        ? "outline outline-2 -outline-offset-2 outline-violet-400"
                        : ""
                    } ${draggedKey === column.key ? "opacity-50" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(column)}
                      disabled={!column.sortProperty}
                      className={`truncate text-left ${column.sortProperty ? "hover:text-foreground" : ""}`}
                    >
                      {column.label}
                      {activeSort && (activeSort.direction === "asc" ? " ↑" : " ↓")}
                    </button>
                    <span
                      onMouseDown={(event) => startResize(event, column)}
                      className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize select-none hover:bg-violet-300/50 dark:hover:bg-violet-500/30"
                    />
                  </th>
                );
              })}
              <th className="px-2 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border ">
            {publications.map((post) => (
              <tr key={post.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                <td className="px-2 py-2">
                  <input
                    type="checkbox"
                    checked={selected.has(post.id)}
                    onChange={() => toggleSelect(post.id)}
                    aria-label={t("publications.table.selectOne", { name: post.excerpt || t("publications.kanban.thisPublication") })}
                  />
                </td>
                {orderedColumns.map((column) => (
                  <td key={column.key} className="px-1 py-1.5">
                    {renderCell(post, column)}
                  </td>
                ))}
                <td className="px-2 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => onOpen(post.id)}
                    aria-label={t("publications.table.openPublication")}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-violet-600 hover:underline dark:text-violet-400"
                  >
                    {t("publications.table.open")}
                  </button>
                </td>
              </tr>
            ))}
            <tr>
              <td className="px-2 py-2" />
              <td colSpan={orderedColumns.length + 1} className="px-1 py-1.5">
                <button
                  type="button"
                  onClick={handleQuickAdd}
                  className="w-full rounded-lg border border-dashed border-zinc-300 px-2 py-1.5 text-left text-sm text-muted-foreground hover:border-violet-300 hover:text-violet-700 dark:border-white/[.16] dark:hover:border-violet-500/40 dark:hover:text-violet-300"
                >
                  + {t("publications.table.quickAdd")}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
