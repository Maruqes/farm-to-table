// API shapes assumed by FE-23. Every field may be missing or renamed later.
// GET /api/admin/orders?status&page -> AdminOrdersPageDto ; admin token required.
// `status` is pending|confirmed|ready|delivered|cancelled and `page` is 1-based.
// The API paginates with a fixed page size of 8 (ADMIN_ORDERS_PAGE_SIZE in
// admin-orders.types.ts).

export interface AdminOrderPartyDto {
  id?: string
  _id?: string
  name?: string
}

export interface AdminOrderDto {
  id?: string
  _id?: string
  // The draft may send the party as an object or just its display name.
  buyer?: AdminOrderPartyDto | string | null
  buyerName?: string
  producer?: AdminOrderPartyDto | string | null
  producerName?: string
  itemCount?: number
  // Only the length is used, as a fallback when `itemCount` is missing.
  items?: unknown[] | null
  total?: number
  status?: string
  createdAt?: string
}

export interface AdminOrdersPageDto {
  items?: AdminOrderDto[] | null
  total?: number
}
