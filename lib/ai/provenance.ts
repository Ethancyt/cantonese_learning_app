// Some JSON providers place these fields directly on an entry despite the nested schema.
// Normalize only this known variation; leave all other fields for strict validation.
export function normalizeAIProvenance(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const result = { ...value } as Record<string, unknown>;
  for (const collection of ["vocabulary", "exercises"]) {
    const entries = result[collection];
    if (!Array.isArray(entries)) continue;
    result[collection] = entries.map((entry: unknown) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry))
        return entry;
      const item = { ...entry } as Record<string, unknown>;
      const flat: Record<string, unknown> = {};
      for (const key of [
        "sourceMaterialId",
        "sourceExcerpt",
        "sourceChunk",
        "sourcePage",
        "generatedByAI",
      ]) {
        if (Object.hasOwn(item, key)) {
          flat[key] = item[key];
          delete item[key];
        }
      }
      const nested = item.provenance;
      if (
        nested !== undefined &&
        (!nested || typeof nested !== "object" || Array.isArray(nested))
      )
        return { ...item, ...flat }; // Malformed provenance must still fail validation.
      if (Object.keys(flat).length || nested) {
        item.provenance = {
          ...flat,
          ...((nested as object) || {}),
          generatedByAI: true,
        };
      }
      return item;
    });
  }
  return result;
}
