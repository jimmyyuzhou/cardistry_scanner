import { describe, expect, it } from "vitest";
import { independenceGroup } from "@/lib/research/independence";
import { classifySource } from "@/lib/research/source-tiers";

describe("source tiers", () => {
  it("classifies official, archive, retailer, community, and unverified domains", () => {
    expect(classifySource("https://fontainecards.com/blue").source_type).toBe("official");
    expect(classifySource("https://www.wopc.co.uk/cards/fontaine").source_tier).toBe(2);
    expect(classifySource("https://artofplay.com/products/carrots").source_type).toBe("retailer");
    expect(classifySource("https://www.reddit.com/r/cardistry").source_type).toBe("community");
    expect(classifySource("https://www.ebay.com/itm/123").source_type).toBe("unverified");
    expect(classifySource("https://random-blog.example/fontaine-blue").source_tier).toBe(5);
  });

  it("does not treat a brand name in a path as official", () => {
    expect(classifySource("https://example.com/fontaine-official-release").source_type).toBe(
      "unverified",
    );
  });
});

describe("independence grouping", () => {
  it("collapses cloned marketplace listings into one group", () => {
    const listings = [
      "Fontaine Blue Playing Cards Rare",
      "Fontaine Blue Playing Cards Rare!!!",
      "fontaine blue playing cards rare",
      "Fontaine Blue Playing Cards Rare - fast ship",
      "FONTAINE BLUE PLAYING CARDS RARE",
    ];

    const groups = new Set(
      listings.map((title, index) =>
        independenceGroup({
          url: `https://www.ebay.com/itm/${index}`,
          title,
          snippet: "Fontaine Blue Playing Cards Rare. Authentic. Ships worldwide.",
        }),
      ),
    );

    expect(groups.size).toBe(1);
  });

  it("groups copied retailer descriptions", () => {
    const snippet =
      "Fontaine Carrots playing cards. Limited collaboration tuck box. Ships worldwide. Authentic product description copied across stores.";
    const groups = new Set([
      independenceGroup({
        url: "https://artofplay.com/products/carrots",
        title: "Fontaine Carrots",
        snippet,
      }),
      independenceGroup({
        url: "https://penguinmagic.com/p/carrots",
        title: "Fontaine x Carrots Playing Cards",
        snippet,
      }),
    ]);
    expect(groups.size).toBe(1);
  });
});
