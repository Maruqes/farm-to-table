// Domain model consumed by components and hooks. API shapes stay in admin-producers.dto.ts.

export type ProducerDecision = 'approve' | 'reject'

export interface PendingProducer {
  id: string
  name: string
  email: string
  phone: string
  location: string
  bio: string
  categories: string[]
  appliedAt: string | null
}

export interface PendingProducerDecision {
  id: string
  action: ProducerDecision
}

export type ProducerDecisionResult =
  | { ok: true }
  | { ok: false; message: string }
