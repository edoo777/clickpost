export type GammaGenerationStatus = "pending" | "processing" | "completed" | "failed";

export interface GammaGenerateRequest {
  reportId: string;
  title: string;
  /** Contenu structuré du rapport (texte) — Gamma se charge entièrement de la mise en page et du
   * design visuel ; ClickPost ne détermine jamais lui-même la présentation. */
  content: string;
  templateId?: string;
}

export interface GammaGenerateResult {
  generationId: string;
  status: GammaGenerationStatus;
}

export interface GammaStatusResult {
  generationId: string;
  status: GammaGenerationStatus;
  fileUrl?: string;
  errorMessage?: string;
}
