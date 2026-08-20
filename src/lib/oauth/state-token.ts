/**
 * Génération et vérification du paramètre `state` du flux OAuth (protection CSRF) — signé par
 * HMAC-SHA256, sans état côté serveur (aucune table `oauth_states` à créer ni à nettoyer) :
 * toute l'information nécessaire à la validation (workspace, marque, utilisateur, expiration)
 * voyage dans le `state` lui-même, mais ne peut être ni lue en clair de façon utile côté client
 * pour usurper une session, ni modifiée sans invalider la signature.
 *
 * Import relatif volontaire vers token-encryption.ts (plutôt que l'alias `@/` habituel du
 * projet) : ces deux fichiers de sécurité restent ainsi exécutables directement par un moteur
 * Node standard (aucun alias de chemin à résoudre), pour des vérifications reproductibles sans
 * dépendre du bundler Next.js — voir docs/linkedin-test-integration.md, section Tests.
 */
import { createHmac, randomBytes } from "node:crypto";
import { safeEqual } from "./token-encryption.ts";

export interface OAuthStatePayload {
  workspaceId: string;
  brandId: string | null;
  userId: string;
  platform: string;
  /** Aléa anti-répétition — un `state` déjà consommé une fois n'a pas besoin d'être rejeté en
   * base tant que la fenêtre d'expiration reste courte ; l'objectif ici est la protection CSRF
   * (le state provient bien de ClickPost, pour ce workspace/utilisateur précis), pas un
   * remplacement d'idempotence applicative (voir idempotency.ts pour la publication elle-même). */
  nonce: string;
  issuedAt: number;
  /** Champ optionnel, propre à X (PKCE obligatoire même pour un client confidentiel — voir
   * src/lib/x/oauth.ts) : transporte le `code_verifier` généré à l'étape /connect jusqu'au
   * callback, sans nouveau mécanisme de stockage côté serveur (le `state` signé reste la seule
   * information transmise entre les deux étapes, exactement comme pour toute autre plateforme).
   * Absent pour toute autre plateforme — `JSON.stringify` omet les propriétés `undefined`, donc
   * aucun changement de forme du `state` pour LinkedIn/Meta/TikTok/YouTube, qui ne le renseignent
   * jamais. */
  codeVerifier?: string;
}

const MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes — largement suffisant pour un aller-retour OAuth réel.

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(payloadEncoded: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadEncoded).digest("base64url");
}

/** `secret` doit être une valeur serveur déjà secrète et déjà requise (le secret client LinkedIn
 * lui-même) — jamais une nouvelle variable d'environnement dédiée uniquement à cet usage. */
export function createOAuthState(payload: Omit<OAuthStatePayload, "nonce" | "issuedAt">, secret: string): string {
  const full: OAuthStatePayload = { ...payload, nonce: randomBytes(16).toString("hex"), issuedAt: Date.now() };
  const encoded = base64UrlEncode(JSON.stringify(full));
  const signature = sign(encoded, secret);
  return `${encoded}.${signature}`;
}

export type OAuthStateValidation =
  | { valid: true; payload: OAuthStatePayload }
  | { valid: false; reason: "malformed" | "invalid_signature" | "expired" };

/** Rejette explicitement (jamais silencieusement) toute valeur malformée, mal signée, ou
 * expirée — le motif de rejet reste interne (journalisation), jamais reflété tel quel à
 * l'utilisateur au-delà d'un message générique « autorisation invalide ou expirée ». */
export function verifyOAuthState(state: string, secret: string): OAuthStateValidation {
  const parts = state.split(".");
  if (parts.length !== 2) return { valid: false, reason: "malformed" };
  const [encoded, signature] = parts;

  const expectedSignature = sign(encoded, secret);
  if (!safeEqual(signature, expectedSignature)) return { valid: false, reason: "invalid_signature" };

  let payload: OAuthStatePayload;
  try {
    payload = JSON.parse(base64UrlDecode(encoded)) as OAuthStatePayload;
  } catch {
    return { valid: false, reason: "malformed" };
  }

  if (
    typeof payload.workspaceId !== "string" ||
    typeof payload.userId !== "string" ||
    typeof payload.platform !== "string" ||
    typeof payload.issuedAt !== "number"
  ) {
    return { valid: false, reason: "malformed" };
  }

  if (Date.now() - payload.issuedAt > MAX_AGE_MS) return { valid: false, reason: "expired" };

  return { valid: true, payload };
}
