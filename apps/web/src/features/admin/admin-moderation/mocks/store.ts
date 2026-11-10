import type { AdminContentItemDto } from '../admin-moderation.dto'
import type { ContentType } from '../admin-moderation.types'
import { createMockContent } from './content'

// The mock store lives for the session and reseeds on reload, so hide and unhide
// can be exercised again without clearing browser storage.
let store: Record<ContentType, AdminContentItemDto[]> | null = null

function seed(): Record<ContentType, AdminContentItemDto[]> {
  if (!store) store = createMockContent()
  return store
}

function clone(dto: AdminContentItemDto): AdminContentItemDto {
  return { ...dto }
}

export function listMockContent(type: ContentType): AdminContentItemDto[] {
  return seed()[type].map(clone)
}

export function setMockContentHidden(
  type: ContentType,
  id: string,
  hidden: boolean,
): AdminContentItemDto | null {
  const item = seed()[type].find((entry) => entry.id === id || entry._id === id)
  if (!item) return null

  item.hidden = hidden
  return clone(item)
}
