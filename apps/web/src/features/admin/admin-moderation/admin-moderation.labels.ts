import type { ContentType } from './admin-moderation.types'

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  product: 'Products',
  producer: 'Producer pages',
}

export function moderationEmptyMessage(type: ContentType): string {
  return type === 'product'
    ? 'No products to moderate. Products appear here once producers add them to the catalog.'
    : 'No producer pages to moderate. Pages appear here once producers publish them.'
}

export function itemStatusLabel(hidden: boolean): string {
  return hidden ? 'Hidden' : 'Visible'
}

export function itemStatusDetail(hidden: boolean): string {
  return hidden
    ? 'Removed from the public catalog'
    : 'Shown in the public catalog'
}
