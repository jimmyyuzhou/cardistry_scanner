import type { DisplayResult, IdentificationResult } from "@/lib/types";
import { chooseResearchIntent } from "@/lib/research/research-goal";
import { QUERY_BUDGETS, type ResearchBudget } from "@/lib/research/types";

export function isResearchEligible(
  result: DisplayResult,
): result is IdentificationResult {
  if (result.status === "error") {
    return false;
  }
  if (result.status === "invalid" || result.status === "unclear") {
    return false;
  }
  if (result.object_type === "no_deck") {
    return false;
  }
  return (
    result.status === "identified" ||
    result.status === "ambiguous" ||
    result.status === "unknown"
  );
}

export function chooseResearchBudget(
  result: DisplayResult,
): ResearchBudget {
  if (!isResearchEligible(result)) {
    return "skip";
  }
  return chooseResearchIntent(result).budget;
}

export function maxWebQueries(budget: ResearchBudget): number {
  return QUERY_BUDGETS[budget].web;
}
