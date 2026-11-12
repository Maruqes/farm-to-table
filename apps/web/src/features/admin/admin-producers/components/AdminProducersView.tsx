import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { PageState } from '@/components/PageState'
import type {
  PendingProducer,
  ProducerDecision,
  ProducerDecisionResult,
} from '../admin-producers.types'
import { useAdminProducers } from '../useAdminProducers'
import { PendingProducersList } from './PendingProducersList'

export function AdminProducersView() {
  const {
    producers,
    loading,
    error,
    empty,
    pending,
    announcement,
    reload,
    decide,
  } = useAdminProducers()

  const handleDecision = useCallback(
    async (
      producer: PendingProducer,
      action: ProducerDecision,
      reason?: string,
    ): Promise<ProducerDecisionResult> => {
      const result = await decide(producer, action, reason)

      if (result.ok) {
        toast.success(
          action === 'approve'
            ? `${producer.name} was approved and can now sell on Farm to Table.`
            : `${producer.name} was rejected.`,
        )
      } else {
        toast.error(result.message)
      }

      return result
    },
    [decide],
  )

  return (
    <section aria-labelledby="admin-producers-heading" className="flex flex-col gap-6">
      <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-dim no-underline hover:text-ink hover:underline">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to admin overview
      </Link>

      <header>
        <h1 id="admin-producers-heading">Producer approvals</h1>
        <p className="measure text-dim mb-0">
          Review new producer applications before they can sell. Approve the farms
          that fit the marketplace, or reject an application with an optional reason.
        </p>
      </header>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      <PageState
        loading={loading}
        error={error}
        errorMessage={error ?? undefined}
        onRetry={reload}
        empty={empty}
        emptyMessage="No producers are waiting for approval. New applications will appear here."
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-dim mb-0">
            <data
              value={producers.length}
              className="font-semibold tabular"
            >
              {producers.length}
            </data>{' '}
            {producers.length === 1 ? 'application' : 'applications'} waiting for
            review
          </p>

          <PendingProducersList
            producers={producers}
            pending={pending}
            onDecision={handleDecision}
          />
        </div>
      </PageState>
    </section>
  )
}
