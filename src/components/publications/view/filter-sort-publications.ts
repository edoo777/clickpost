import type { PublicationsFiltersValue } from "@/components/publications/PublicationsFilters";
import type { SavedViewFilter, SavedViewSort } from "@/types/saved-view";
import type { Publication } from "@/types/publication";
import { DEFAULT_PUBLICATIONS_FILTERS } from "@/components/publications/PublicationsFilters";

export function filterPublications(posts: Publication[], filters: PublicationsFiltersValue): Publication[] {
  const search = filters.search.trim().toLowerCase();
  return posts.filter((post) => {
    if (filters.brand !== "all" && post.brand !== filters.brand) return false;
    if (filters.platform !== "all" && post.platform !== filters.platform) return false;
    if (filters.status !== "all" && post.status !== filters.status) return false;
    if (filters.owner !== "all" && post.owner !== filters.owner) return false;
    if (filters.dateFrom && post.scheduledFor.slice(0, 10) < filters.dateFrom) return false;
    if (filters.dateTo && post.scheduledFor.slice(0, 10) > filters.dateTo) return false;
    if (search) {
      const haystack = `${post.excerpt} ${post.text} ${post.brand} ${post.theme}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

function sortableValue(post: Publication, property: string): string | number {
  switch (property) {
    case "scheduledFor":
    case "dueDate":
    case "createdAt":
    case "updatedAt": {
      const raw = (post as unknown as Record<string, string | undefined>)[property];
      return raw ? new Date(raw).getTime() : 0;
    }
    case "brand":
    case "platform":
    case "status":
    case "owner":
    case "theme":
    case "format":
    case "priority":
    case "excerpt":
      return (post as unknown as Record<string, string | undefined>)[property]?.toLowerCase() ?? "";
    default:
      return "";
  }
}

export function sortPublications(posts: Publication[], sorting: SavedViewSort[]): Publication[] {
  if (sorting.length === 0) {
    return [...posts].sort(
      (a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
    );
  }
  return [...posts].sort((a, b) => {
    for (const sort of sorting) {
      const va = sortableValue(a, sort.property);
      const vb = sortableValue(b, sort.property);
      if (va < vb) return sort.direction === "asc" ? -1 : 1;
      if (va > vb) return sort.direction === "asc" ? 1 : -1;
    }
    return 0;
  });
}

/** Convertit les filtres simples de la barre en modèle SavedViewFilter[] — pour la persistance
 * dans le système de vues enregistrées existant (pas de second modèle de filtres). */
export function filtersToSavedViewFilters(filters: PublicationsFiltersValue): SavedViewFilter[] {
  const list: SavedViewFilter[] = [];
  if (filters.search) list.push({ property: "search", operator: "contains", value: filters.search });
  if (filters.brand !== "all") list.push({ property: "brand", operator: "equals", value: filters.brand });
  if (filters.platform !== "all") list.push({ property: "platform", operator: "equals", value: filters.platform });
  if (filters.status !== "all") list.push({ property: "status", operator: "equals", value: filters.status });
  if (filters.owner !== "all") list.push({ property: "owner", operator: "equals", value: filters.owner });
  if (filters.dateFrom) list.push({ property: "scheduledFor", operator: "after", value: filters.dateFrom });
  if (filters.dateTo) list.push({ property: "scheduledFor", operator: "before", value: filters.dateTo });
  return list;
}

export function savedViewFiltersToFilters(list: SavedViewFilter[]): PublicationsFiltersValue {
  const result: PublicationsFiltersValue = { ...DEFAULT_PUBLICATIONS_FILTERS };
  for (const filter of list) {
    const value = filter.value;
    switch (filter.property) {
      case "search":
        if (typeof value === "string") result.search = value;
        break;
      case "brand":
        if (typeof value === "string") result.brand = value;
        break;
      case "platform":
        if (typeof value === "string") result.platform = value as PublicationsFiltersValue["platform"];
        break;
      case "status":
        if (typeof value === "string") result.status = value as PublicationsFiltersValue["status"];
        break;
      case "owner":
        if (typeof value === "string") result.owner = value;
        break;
      case "scheduledFor":
        if (typeof value === "string" && filter.operator === "after") result.dateFrom = value;
        if (typeof value === "string" && filter.operator === "before") result.dateTo = value;
        break;
      default:
        break;
    }
  }
  return result;
}
