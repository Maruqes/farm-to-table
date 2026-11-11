// API shapes assumed by FE-19. Every field may be missing or renamed later.
// GET /api/admin/producers?status=pending -> PendingProducerDto[] ; admin token required.
// POST /api/admin/producers/:id/approve -> 200.
// POST /api/admin/producers/:id/reject { reason? } -> 200.

export interface PendingProducerDto {
  id?: string
  _id?: string
  name?: string
  email?: string
  phone?: string
  location?: string
  bio?: string
  categories?: string[] | null
  appliedAt?: string
  createdAt?: string
  status?: string
}

export interface RejectProducerRequestDto {
  reason?: string
}
