/**
 * Analyseur RSS 2.0 minimal, volontairement sans dépendance externe (les trois flux du MVP —
 * YouTube, Meta Newsroom, Pinterest Newsroom — ont été vérifiés manuellement comme du RSS 2.0
 * standard avant intégration). N'assume rien au-delà de <item>/<title>/<link>/<pubDate>/
 * <description> : un flux mal formé produit simplement zéro élément plutôt qu'une exception ou
 * une donnée devinée. Ne produit jamais de HTML rendu tel quel : uniquement du texte brut,
 * jamais consommé via dangerouslySetInnerHTML.
 */

export interface ParsedFeedItem {
  title: string;
  link: string;
  pubDate?: string;
  description?: string;
  imageUrl?: string;
}

const MAX_DESCRIPTION_LENGTH = 400;

function rawTagContent(block: string, tag: string): string | undefined {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? match[1] : undefined;
}

function cdataOrRaw(value: string): string {
  const cdataMatch = value.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  return cdataMatch ? cdataMatch[1] : value;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripDangerousBlocks(value: string): string {
  return value.replace(/<(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\/\1>/gi, " ");
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, " ");
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * Nettoyage texte d'un champ RSS potentiellement HTML : décode d'abord les entités (un flux peut
 * échapper le HTML en entités plutôt que l'envelopper en CDATA — décoder seulement après avoir
 * retiré les balises laisserait alors de vraies balises dans le texte final), retire
 * scripts/styles/iframes avec leur contenu, retire toute balise restante, puis redécode
 * (flux doublement échappés) avant de normaliser les espaces. Ne renvoie jamais de balise.
 */
function cleanTextField(raw: string): string {
  const source = cdataOrRaw(raw);
  const decodedOnce = decodeEntities(source);
  const withoutDangerous = stripDangerousBlocks(decodedOnce);
  const withoutTags = stripTags(withoutDangerous);
  const decodedTwice = decodeEntities(withoutTags);
  return collapseWhitespace(decodedTwice);
}

/** Extrait et valide une URL d'image depuis un champ potentiellement HTML — jamais conservée si
 * elle n'est pas une URL http(s) absolue bien formée. */
function extractImageUrl(raw: string): string | undefined {
  const source = decodeEntities(cdataOrRaw(raw));
  const match = source.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (!match) return undefined;
  try {
    const url = new URL(decodeEntities(match[1]));
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function extractLink(block: string): string | undefined {
  // RSS classique : <link>https://...</link>. Certains flux Atom-like utilisent <link href="..."/>.
  const simple = rawTagContent(block, "link");
  if (simple && simple.trim()) return cleanTextField(simple);
  const attr = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  return attr ? attr[1] : undefined;
}

export function parseRssItems(xml: string, limit = 20): ParsedFeedItem[] {
  const items: ParsedFeedItem[] = [];
  const blocks = xml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) ?? [];

  for (const block of blocks.slice(0, limit)) {
    const rawTitle = rawTagContent(block, "title");
    const title = rawTitle ? cleanTextField(rawTitle) : undefined;
    const link = extractLink(block);
    if (!title || !link) continue; // élément inexploitable — jamais complété par une valeur inventée.

    const rawPubDate = rawTagContent(block, "pubDate");
    const rawDescription = rawTagContent(block, "description");
    const description = rawDescription ? cleanTextField(rawDescription).slice(0, MAX_DESCRIPTION_LENGTH) : undefined;
    const imageUrl = rawDescription ? extractImageUrl(rawDescription) : undefined;

    items.push({
      title,
      link,
      pubDate: rawPubDate ? cleanTextField(rawPubDate) : undefined,
      description: description && description.length > 0 ? description : undefined,
      imageUrl,
    });
  }

  return items;
}
