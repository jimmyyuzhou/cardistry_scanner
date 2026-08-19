import type { SearchHit } from "@/lib/research/types";

export const ebayProviderReserved = {
  async search(): Promise<SearchHit[]> {
    return [];
  },
};
