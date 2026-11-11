// Domain model consumed by components and hooks. API shapes stay in admin-moderation.dto.ts.

export type ContentType = 'product' | 'producer'

export interface AdminContentItem {
  id: string
  name: string
  hidden: boolean
}

export type ModerationActionResult =
  | { ok: true }
  | { ok: false; message: string }
