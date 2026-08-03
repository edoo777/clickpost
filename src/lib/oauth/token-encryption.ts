/**
 * Chiffrement applicatif des jetons OAuth avant écriture en base — défense en profondeur,
 * indépendante de la RLS de `social_connections` (qui bloque déjà tout accès hors service_role).
 * Même une fuite de la base ou de la clé service_role seule ne suffit pas à récupérer un jeton en
 * clair sans `TOKEN_ENCRYPTION_KEY`, gardée uniquement dans les variables d'environnement serveur,
 * jamais dans Git ni exposée au client.
 *
 * Volontairement sans aucune dépendance interne au projet (uniquement `node:crypto`) : ce fichier
 * doit rester auditable isolément et testable sans résoudre les alias `@/` du bundler.
 *
 * AES-256-GCM : authentifié (détecte toute altération du texte chiffré, pas seulement un jeton
 * illisible) — un jeton corrompu ou trafiqué échoue explicitement au déchiffrement plutôt que de
 * renvoyer une valeur incorrecte silencieusement.
 */
import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH_BYTES = 32;
const IV_LENGTH_BYTES = 12;

export class TokenEncryptionNotConfiguredError extends Error {
  constructor() {
    super("TOKEN_ENCRYPTION_KEY absente ou invalide — le chiffrement des jetons est indisponible.");
    this.name = "TokenEncryptionNotConfiguredError";
  }
}

/** `TOKEN_ENCRYPTION_KEY` attendue en base64, décodée vers exactement 32 octets (AES-256). Ne
 * lève jamais d'exception hors de ce module — renvoie `null` si absente/mal formée, pour que les
 * appelants dégradent proprement (`isConfigured() === false`) plutôt que de planter. */
function readKey(): Buffer | null {
  const raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw) return null;
  try {
    const decoded = Buffer.from(raw, "base64");
    if (decoded.length !== KEY_LENGTH_BYTES) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function isTokenEncryptionConfigured(): boolean {
  return readKey() !== null;
}

/** Génère une clé aléatoire valide (base64) — utilitaire pour vous aider à produire
 * `TOKEN_ENCRYPTION_KEY` une seule fois ; jamais appelé automatiquement par l'application. */
export function generateTokenEncryptionKey(): string {
  return randomBytes(KEY_LENGTH_BYTES).toString("base64");
}

/** Format stocké : base64(iv [12 o] + authTag [16 o] + ciphertext) — une seule chaîne, un seul
 * champ texte en base, aucune structure supplémentaire à maintenir. */
export function encryptToken(plaintext: string): string {
  const key = readKey();
  if (!key) throw new TokenEncryptionNotConfiguredError();
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
}

/** Lève systématiquement en cas d'altération, de mauvaise clé, ou de format invalide — jamais de
 * valeur par défaut silencieuse qui masquerait une corruption de donnée. */
export function decryptToken(encrypted: string): string {
  const key = readKey();
  if (!key) throw new TokenEncryptionNotConfiguredError();

  const raw = Buffer.from(encrypted, "base64");
  if (raw.length < IV_LENGTH_BYTES + 16) throw new Error("Jeton chiffré invalide (trop court).");

  const iv = raw.subarray(0, IV_LENGTH_BYTES);
  const authTag = raw.subarray(IV_LENGTH_BYTES, IV_LENGTH_BYTES + 16);
  const ciphertext = raw.subarray(IV_LENGTH_BYTES + 16);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}

/** Comparaison à temps constant pour tout secret court comparé côté serveur (ex. état OAuth) —
 * évite une fuite d'information par mesure de temps sur une comparaison naïve `===`. */
export function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, "utf8");
  const bufferB = Buffer.from(b, "utf8");
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}
