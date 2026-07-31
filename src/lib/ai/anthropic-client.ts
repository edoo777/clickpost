import Anthropic from "@anthropic-ai/sdk";

/**
 * Client Anthropic — importé UNIQUEMENT par des fichiers exécutés côté serveur (routes Next.js
 * sous src/app/api/ia/). Jamais importé par un composant "use client" ni par
 * content-generation-provider.ts (qui n'appelle que fetch() vers notre propre route). La clé et
 * le modèle ne portent jamais le préfixe NEXT_PUBLIC_ et ne sont donc jamais inclus dans le
 * bundle navigateur.
 */

let cachedClient: Anthropic | null = null;

export function isAnthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY) && Boolean(process.env.ANTHROPIC_MODEL);
}

export function getAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY manquant — vérifier isAnthropicConfigured() avant d'appeler getAnthropicClient().");
  }
  if (!cachedClient) {
    cachedClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 2, timeout: 30_000 });
  }
  return cachedClient;
}

/** Jamais codé en dur : lu uniquement depuis la variable d'environnement serveur. */
export function getAnthropicModel(): string {
  const model = process.env.ANTHROPIC_MODEL;
  if (!model) {
    throw new Error("ANTHROPIC_MODEL manquant — vérifier isAnthropicConfigured() avant d'appeler getAnthropicModel().");
  }
  return model;
}
