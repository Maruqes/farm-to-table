import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { PageState } from '@/components/PageState'
import { Button } from '@/components/ui/button'
import { OrderCard } from './OrderCard'
import type { RateResult } from '../my-orders.types'
import { useMyOrders } from '../useMyOrders'

export function MyOrdersView() {
  const { orders, loading, error, announcement, reload, rateOrder } = useMyOrders()

  const handleRate = useCallback(
    async (orderId: string, rating: number, text: string): Promise<RateResult> => {
      const result = await rateOrder(orderId, rating, text)
      if (result.ok) {
        toast.success('Rating saved. Thank you for telling us what you thought.')
      } else if (result.kind === 'already') {
        toast.info(result.message)
      }
      return result
    },
    [rateOrder],
  )

  const showEmpty = !loading && !error && orders.length === 0

  return (
    <section aria-labelledby="my-orders-heading" className="space-y-6">
      <header className="space-y-1">
        <h1 id="my-orders-heading">My orders</h1>
        <p className="max-w-[65ch] text-muted-foreground">
          Follow each order from the farm to your table. The producer moves it through
          the steps and you see the change here as it happens.
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
        empty={showEmpty}
        emptyMessage="You have no orders yet. Browse the catalog to buy fresh produce directly from local producers."
      >
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id}>
              <OrderCard order={order} onRate={handleRate} />
            </li>
          ))}
        </ul>
      </PageState>

      {showEmpty && (
        <div className="flex justify-center">
          <Button asChild>
            <Link to="/">Browse the catalog</Link>
          </Button>
        </div>
      )}
    </section>
  )
}
