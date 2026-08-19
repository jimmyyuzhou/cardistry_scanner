import { describe, expect, it } from "vitest";
import { formatCanonicalName, normalizeEditionLabel } from "@/lib/research/names";

describe("candidate name normalization", () => {
  it("formats collaboration editions without using × for the version", () => {
    expect(
      formatCanonicalName({ brand: "Fontaine", series: "Carrots", edition: "v2" }),
    ).toBe("Fontaine × Carrots V2");
    expect(
      formatCanonicalName({ brand: "Fontaine", series: "Fontaine × Carrots" }),
    ).toBe("Fontaine × Carrots");
    expect(
      formatCanonicalName({ brand: "Fontaine", series: "Carrots" }),
    ).toBe("Fontaine × Carrots");
    expect(
      formatCanonicalName({ brand: "Fontaine", series: "Carrots", edition: "V1" }),
    ).toBe("Fontaine × Carrots V1");
    expect(
      formatCanonicalName({ brand: "Fontaine", series: "Carrots", edition: "version 3" }),
    ).toBe("Fontaine × Carrots V3");
  });

  it("formats colorways without a collaboration mark", () => {
    expect(formatCanonicalName({ brand: "Fontaine", series: "Blue" })).toBe("Blue Fontaine");
    expect(formatCanonicalName({ brand: "Fontaine", series: "Sleight" })).toBe("Fontaine Sleight");
  });

  it("normalizes edition labels", () => {
    expect(normalizeEditionLabel("v2")).toBe("V2");
    expect(normalizeEditionLabel("2nd edition")).toBe("V2");
  });
});
