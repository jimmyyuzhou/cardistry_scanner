const HALLUCINATED_ENTITIES = /^(1st|1stplayingcards)$/i;

export function isHallucinatedEntityName(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }
  const compact = value.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return HALLUCINATED_ENTITIES.test(compact);
}
