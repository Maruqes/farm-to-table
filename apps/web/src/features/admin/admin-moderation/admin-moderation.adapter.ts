import type { AdminContentItemDto } from './admin-moderation.dto'
import type { AdminContentItem } from './admin-moderation.types'

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

export function adaptAdminContentItem(
  dto: AdminContentItemDto | null | undefined,
  index = 0,
): AdminContentItem {
  return {
    id: asString(dto?.id || dto?._id, `content-${index + 1}`),
    name: asString(dto?.name, 'Untitled item'),
    hidden: dto?.hidden === true,
  }
}

export function adaptAdminContentItems(
  dto: AdminContentItemDto[] | null | undefined,
): AdminContentItem[] {
  const raw = Array.isArray(dto) ? dto : []
  return raw.map((item, index) => adaptAdminContentItem(item, index))
}
