import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { PageState } from '@/components/PageState'
import { ORDER_STATUS_LABELS } from '../producer-orders.labels'
import type { OrderStatus } from '../producer-orders.types'
import { useProducerOrders } from '../useProducerOrders'
import { ProducerOrdersTable } from './ProducerOrdersTable'

export function ProducerOrdersView() {
  const {
    orders,
    loading,
    error,
    empty,
    savingId,
    announcement,
    reload,
    changeStatus,
  } = useProducerOrders()

  const handleChangeStatus = useCallback(
    async (orderId: string, status: OrderStatus): Promise<boolean> => {
      const result = await changeStatus(orderId, status)

      if (result.ok) {
        toast.success(
          status === 'cancelled'
            ? 'Order cancelled. The buyer is told and the stock is back in your catalog.'
            : `Order marked as ${ORDER_STATUS_LABELS[status].toLowerCase()}.`,
        )
        return true
      }

      toast.error(result.message)
      return false
    },
    [changeStatus],
  )

  return (
    <section aria-labelledby="producer-orders-heading" className="space-y-6">
      <Link
        to="/producer"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to dashboard
      </Link>

      <header className="space-y-1">
        <h1 id="producer-orders-heading">Orders</h1>
        <p className="max-w-[65ch] text-muted-foreground">
          Orders that contain your products. Move each one to the next step when it is
          ready, and the buyer hears about it straight away.
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
        emptyMessage="You have no orders yet. When a buyer orders your products, it will appear here with the items and pickup or delivery details."
      >
        <ProducerOrdersTable
          orders={orders}
          savingId={savingId}
          onChangeStatus={handleChangeStatus}
        />
      </PageState>
    </section>
  )
}
