// Public display name of a producer is the farm name (backend README,
// data model decisions). Personal account names never leak to buyer-facing
// surfaces; farmName falls back to name for old documents without one.
export function publicProducerName(doc: { name: string, producer?: { farmName?: string } | null }): string {
  return doc.producer?.farmName ?? doc.name
}
