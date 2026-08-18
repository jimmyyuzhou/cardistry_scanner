import type { IdentificationResult } from "@/lib/types";

export const MOCK_IDENTIFICATION: IdentificationResult = {
  brand: "Fontaine",
  series: "Carrots",
  version: "V2",
  confidence: 93,
  evidence: [
    "Fontaine branding detected",
    "Carrots collaboration graphics detected",
    "Visual design resembles Carrots V2",
  ],
  uncertainty: ["Tuck bottom has not been inspected"],
};
