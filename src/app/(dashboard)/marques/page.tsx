import { BrandCard } from "@/components/brands/BrandCard";
import { brandProfiles } from "@/lib/brand-profiles";

export default function BrandsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Profils de marque
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Configurez l&apos;identité de chaque marque pour guider la génération de contenu.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brandProfiles.map((profile) => (
          <BrandCard key={profile.id} profile={profile} />
        ))}
      </div>
    </div>
  );
}
