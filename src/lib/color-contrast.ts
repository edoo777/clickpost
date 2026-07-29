function hexToRgb(hex: string): [number, number, number] | null {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!match) return null;
  return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const [rl, gl, bl] = [channel(r), channel(g), channel(b)];
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

/** Ratio de contraste WCAG entre deux couleurs hexadécimales (1 à 21), ou null si invalide. */
export function contrastRatio(colorA: string, colorB: string): number | null {
  const rgbA = hexToRgb(colorA);
  const rgbB = hexToRgb(colorB);
  if (!rgbA || !rgbB) return null;
  const lighter = Math.max(relativeLuminance(rgbA), relativeLuminance(rgbB));
  const darker = Math.min(relativeLuminance(rgbA), relativeLuminance(rgbB));
  return (lighter + 0.05) / (darker + 0.05);
}

/** Seuil WCAG AA pour texte normal (4.5:1) par défaut. */
export function isLowContrast(colorA: string, colorB: string, minimumRatio = 4.5): boolean {
  const ratio = contrastRatio(colorA, colorB);
  return ratio === null ? false : ratio < minimumRatio;
}
