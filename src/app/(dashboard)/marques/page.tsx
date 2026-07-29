"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BrandCard } from "@/components/brands/BrandCard";
import { CreateBrandPanel } from "@/components/brands/CreateBrandPanel";
import { useBrandsSession } from "@/lib/brands-store";

type StatusFilter = "active" | "archived" | "all";

export default function BrandsPage() {
  const router = useRouter();
  const { brands, activeBrandId, canManageBrands, createBrand } = useBrandsSession();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [isCreating, setIsCreating] = useState(false);

  const filteredBrands = useMemo(() => {
    const query = search.trim().toLowerCase();
    return brands.filter((brand) => {
      if (statusFilter !== "all" && brand.status !== statusFilter) return false;
      if (!query) return true;
      return brand.name.toLowerCase().includes(query) || brand.industry.toLowerCase().includes(query);
    });
  }, [brands, search, statusFilter]);

  function handleCreate(input: { name: string; industry: string; description: string }) {
    const brand = createBrand(input);
    setIsCreating(false);
    router.push(`/marques/${brand.id}`);
  }

  const hasAnyBrand = brands.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground ">Marques</h1>
          <p className="text-sm text-muted-foreground ">
            Gérez les marques de votre workspace et configurez leur identité pour guider la génération de contenu.
          </p>
        </div>
        {canManageBrands && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40"
          >
            + Créer une marque
          </button>
        )}
      </header>

      {hasAnyBrand && (
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher une marque..."
            className="w-full max-w-xs rounded-lg border border-border bg-surface px-3 py-2 text-sm text-zinc-800  dark:text-zinc-200"
          />
          <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1 ">
            {(
              [
                { value: "active", label: "Actives" },
                { value: "archived", label: "Archivées" },
                { value: "all", label: "Toutes" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatusFilter(option.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === option.value
                    ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                    : "text-zinc-600 hover:bg-muted  dark:text-zinc-400"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {!hasAnyBrand ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-surface px-6 py-16 text-center dark:border-white/[.16] ">
          <p className="text-base font-semibold text-foreground ">Aucune marque pour le moment</p>
          <p className="max-w-sm text-sm text-muted-foreground ">
            Créez votre première marque pour commencer à générer et planifier du contenu qui lui est propre.
          </p>
          {canManageBrands && (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="mt-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40"
            >
              + Créer ma première marque
            </button>
          )}
        </div>
      ) : filteredBrands.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-surface px-6 py-10 text-center text-sm text-muted-foreground dark:border-white/[.16] ">
          Aucune marque ne correspond à cette recherche.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBrands.map((brand) => (
            <BrandCard key={brand.id} brand={brand} isActive={brand.id === activeBrandId} />
          ))}
        </div>
      )}

      {isCreating && (
        <CreateBrandPanel onClose={() => setIsCreating(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}
