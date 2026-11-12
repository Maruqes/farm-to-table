// Crate colours and lot numbers of the painted price board (RULES.md).

const CRATE: Record<string, string> = {
  vegetables: 'bg-tile-veg',
  fruit: 'bg-tile-fruit',
  honey: 'bg-tile-honey',
  wine: 'bg-tile-wine',
  cheese: 'bg-tile-cheese',
  bakery: 'bg-tile-bakery',
}

/** Tailwind background class of a category's crate colour. */
export function crateClass(category: string | undefined): string {
  return CRATE[category ?? ''] ?? 'bg-tile-veg'
}

// shortcut: lot numbers are derived from the id, so two items can share one; upgrade to an API field through a contract ticket.
/** Three-digit lot number for anything on sale (product, auction). */
export function lotNumber(id: string): string {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 999
  return String(hash + 1).padStart(3, '0')
}
