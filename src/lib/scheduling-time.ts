/**
 * Conversion entre une date-heure "naïve" (sans fuseau, telle que saisie dans un champ
 * `datetime-local` — voir PublicationForm.tsx) interprétée dans un fuseau IANA donné
 * (`Publication.timeZone`), et l'instant UTC réel correspondant. Sans dépendance ajoutée
 * (uniquement `Intl`, natif) : le seul fuseau explicitement connu de l'application avant ce
 * fichier était le libellé `timeZone` lui-même, jamais réellement appliqué à la conversion —
 * `scheduled_for` est un `timestamptz` côté Supabase, donc toute valeur naïve écrite sans
 * conversion était jusqu'ici interprétée dans le fuseau de la session Postgres (UTC), pas dans
 * le fuseau réellement choisi par l'utilisateur. Utilisé aux deux bornes de la synchronisation
 * (voir runtime.ts) pour que l'aller-retour local → Supabase → local ne dérive jamais.
 */

function normalizeNaive(naiveDateTime: string): string {
  return naiveDateTime.length === 16 ? `${naiveDateTime}:00` : naiveDateTime;
}

/** Naïve (fuseau `timeZone`) → instant UTC réel. */
export function zonedNaiveToUtcInstant(naiveDateTime: string, timeZone: string): Date {
  const normalized = normalizeNaive(naiveDateTime);
  const guess = new Date(`${normalized}Z`);
  if (Number.isNaN(guess.getTime())) return new Date(naiveDateTime);
  try {
    const asZoned = new Date(guess.toLocaleString("en-US", { timeZone }));
    const asUtc = new Date(guess.toLocaleString("en-US", { timeZone: "UTC" }));
    const offsetMs = asUtc.getTime() - asZoned.getTime();
    return new Date(guess.getTime() + offsetMs);
  } catch {
    // Fuseau inconnu/invalide — traité comme UTC plutôt que de faire échouer la synchronisation.
    return guess;
  }
}

/** Instant UTC réel → naïve (fuseau `timeZone`), inverse exact de zonedNaiveToUtcInstant pour un
 * réaffichage correct dans un champ `datetime-local` après un pull depuis Supabase. */
export function utcInstantToZonedNaive(utcInstant: Date, timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(utcInstant);
    const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
    return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`;
  } catch {
    return utcInstant.toISOString().slice(0, 19);
  }
}
