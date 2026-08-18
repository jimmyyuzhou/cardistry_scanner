export type AppStep = "home" | "preview" | "analyzing" | "result";

export type IdentificationResult = {
  brand: string;
  series: string;
  version: string;
  confidence: number;
  evidence: string[];
  uncertainty: string[];
};
