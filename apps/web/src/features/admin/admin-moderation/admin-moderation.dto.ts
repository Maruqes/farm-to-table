// API shapes assumed by FE-21. Every field may be missing or renamed later.
// GET /api/admin/content?type=product|producer -> AdminContentItemDto[] ; admin token required.
// PATCH /api/admin/content/:type/:id { hidden } -> 200 AdminContentItemDto.

export interface AdminContentItemDto {
  id?: string
  _id?: string
  name?: string
  hidden?: boolean
}
