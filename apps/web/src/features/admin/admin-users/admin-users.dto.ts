// API shapes assumed by FE-22. Every field may be missing or renamed later.
// GET /api/admin/users?q&role&page -> AdminUsersPageDto ; admin token required.
// `q` matches a user's name or email, `role` is buyer|producer|admin and `page`
// is 1-based. The API paginates with a fixed page size of 8
// (ADMIN_USERS_PAGE_SIZE in admin-users.types.ts).

export interface AdminUserDto {
  id?: string
  _id?: string
  name?: string
  email?: string
  role?: string
  // Account state. Some backends also send it as `status`.
  state?: string
  status?: string
}

export interface AdminUsersPageDto {
  items?: AdminUserDto[] | null
  total?: number
}
