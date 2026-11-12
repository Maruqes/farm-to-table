import { Link, useParams } from 'react-router-dom'
import { PageState } from '@/components/PageState'
import { Button } from '@/components/ui/button'
import {
  ProducerPublicView,
  useProducerPublic,
} from '@/features/producer/producer-public'

export default function ProducerPublicPage() {
  const { id = '' } = useParams<{ id: string }>()
  const { producer, loading, error, notFound, reload } = useProducerPublic(id)

  if (notFound) {
    return (
      <div className="vstack gap-4">
        <PageState
          empty
          emptyMessage="We could not find this producer. The page may have been removed or hidden."
        />
        <div className="d-flex justify-content-center">
          <Button asChild variant="outline">
            <Link to="/">Back to catalog</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <PageState
      loading={loading}
      error={error}
      errorMessage={error ?? undefined}
      onRetry={reload}
    >
      {producer && <ProducerPublicView key={producer.id} producer={producer} />}
    </PageState>
  )
}
