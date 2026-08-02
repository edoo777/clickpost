/**
 * « Musiques et sons » — état explicatif uniquement en MVP. Aucun fournisseur légal et
 * accessible n'a été identifié à l'audit (Spotify Charts retiré, TikTok Commercial Music Library
 * sans API publique, etc.) : jamais de musique fictive, jamais de fausse promesse de temps réel.
 */
export function MusicTrendsSection() {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Musiques et sons</h2>
        <p className="text-xs text-muted-foreground">Tendances audio et sons populaires.</p>
      </div>

      <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-center">
        <p className="text-sm font-medium text-foreground">
          Aucune source officielle de tendances musicales n&apos;est encore configurée.
        </p>
        <p className="mx-auto mt-2 max-w-md text-xs text-muted-foreground">
          L&apos;audit des fournisseurs légaux (API musicales, bibliothèques commerciales des plateformes) n&apos;a
          identifié aucune source publique, officielle et accessible pour ce besoin à ce jour. Cette section sera
          activée uniquement si une source fiable et documentée devient disponible.
        </p>
        <p className="mt-3 text-xs font-medium text-amber-700 dark:text-amber-400">
          La popularité d&apos;un son ne garantit pas les droits d&apos;utilisation commerciale.
        </p>
      </div>
    </section>
  );
}
