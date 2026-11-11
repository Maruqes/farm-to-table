import { useId, useState } from 'react'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, formatMoney } from '@/services/format'
import {
  ORDER_STATUS_LABELS,
  canCancel,
  fulfilmentLabel,
  nextOrderStatus,
  shortOrderRef,
} from '../producer-orders.labels'
import type { OrderStatus, ProducerOrder } from '../producer-orders.types'

const selectClassName =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

function statusBadgeVariant(
  status: OrderStatus,
): 'secondary' | 'destructive' | 'outline' {
  if (status === 'delivered') return 'secondary'
  if (status === 'cancelled') return 'destructive'
  return 'outline'
}

interface OrderRowProps {
  order: ProducerOrder
  saving: boolean
  onChangeStatus: (orderId: string, status: OrderStatus) => Promise<boolean>
}

function OrderRow({ order, saving, onChangeStatus }: OrderRowProps) {
  const headingId = useId()
  const confirmId = useId()
  const selectId = useId()
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const next = nextOrderStatus(order.status)
  const cancellable = canCancel(order.status)

  async function handleCancel() {
    const changed = await onChangeStatus(order.id, 'cancelled')
    if (changed) setConfirmingCancel(false)
  }

  return (
    <li className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_8rem_8rem_13rem] md:items-center md:gap-4">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h2 id={headingId} className="text-base font-semibold">
            Order{' '}
            <data value={order.id} title={order.id} className="tabular">
              {shortOrderRef(order.id)}
            </data>
          </h2>
          {order.createdAt && (
            <span className="text-sm text-muted-foreground">
              Placed <time dateTime={order.createdAt}>{formatDate(order.createdAt)}</time>
            </span>
          )}
        </div>

        <p className="text-sm">
          {order.buyer.name}
          <span className="text-muted-foreground">
            {' '}
            · {fulfilmentLabel(order.fulfilment.method)}
          </span>
        </p>

        {order.fulfilment.method === 'delivery' && order.fulfilment.address && (
          <p className="break-words text-sm text-muted-foreground">
            {order.fulfilment.address}
          </p>
        )}

        {order.items.length > 0 && (
          <p className="break-words text-sm text-muted-foreground">
            {order.items
              .map((item) => `${item.name} × ${item.quantity} ${item.unit}`)
              .join(', ')}
          </p>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2 md:block">
        <span className="text-sm text-muted-foreground md:sr-only">Total</span>
        <data
          value={order.total}
          className="whitespace-nowrap font-display text-base font-extrabold tabular"
        >
          {formatMoney(order.total)}
        </data>
      </div>

      <div className="flex items-center justify-between gap-2 md:block">
        <span className="text-sm text-muted-foreground md:sr-only">Status</span>
        <Badge variant={statusBadgeVariant(order.status)}>
          {ORDER_STATUS_LABELS[order.status]}
        </Badge>
      </div>

      {(next || cancellable) && (
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-1">
          {next && (
            <div className="space-y-1">
              <label htmlFor={selectId} className="sr-only">
                Update status for order {shortOrderRef(order.id)}
              </label>
              <select
                id={selectId}
                value={order.status}
                onChange={(event) => {
                  const value = event.target.value as OrderStatus
                  if (value !== order.status) void onChangeStatus(order.id, value)
                }}
                disabled={saving}
                aria-describedby={headingId}
                className={selectClassName}
              >
                <option value={order.status}>
                  {ORDER_STATUS_LABELS[order.status]}
                </option>
                <option value={next}>Move to {ORDER_STATUS_LABELS[next]}</option>
              </select>
            </div>
          )}

          {cancellable && !confirmingCancel && (
            <Button
              type="button"
              variant="outline"
              className="h-10 px-3"
              onClick={() => setConfirmingCancel(true)}
              disabled={saving}
              aria-label={`Cancel order ${shortOrderRef(order.id)}`}
            >
              <X className="size-4" aria-hidden="true" />
              Cancel order
            </Button>
          )}
        </div>
      )}

      {confirmingCancel && cancellable && (
        <div
          role="alertdialog"
          aria-labelledby={`${confirmId}-title`}
          aria-describedby={`${confirmId}-description`}
          aria-busy={saving}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setConfirmingCancel(false)
          }}
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 md:col-span-4"
        >
          <p id={`${confirmId}-title`} className="font-medium">
            Cancel order {shortOrderRef(order.id)}?
          </p>
          <p
            id={`${confirmId}-description`}
            className="mt-1 text-sm text-muted-foreground"
          >
            The buyer is told straight away and the stock returns to your catalog.
            Cancelling cannot be undone.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10"
              onClick={() => setConfirmingCancel(false)}
              disabled={saving}
              autoFocus
            >
              Keep order
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="h-10"
              onClick={() => void handleCancel()}
              disabled={saving}
            >
              {saving ? 'Cancelling…' : 'Cancel order'}
            </Button>
          </div>
        </div>
      )}
    </li>
  )
}

interface ProducerOrdersTableProps {
  orders: ProducerOrder[]
  savingId: string | null
  onChangeStatus: (orderId: string, status: OrderStatus) => Promise<boolean>
}

export function ProducerOrdersTable({
  orders,
  savingId,
  onChangeStatus,
}: ProducerOrdersTableProps) {
  return (
    <div>
      <div
        aria-hidden="true"
        className="hidden rounded-t-xl border border-b-0 bg-muted/40 px-4 py-2.5 text-sm font-medium text-muted-foreground md:grid md:grid-cols-[minmax(0,1fr)_8rem_8rem_13rem] md:gap-4"
      >
        <span>Order</span>
        <span>Total</span>
        <span>Status</span>
        <span>Actions</span>
      </div>

      <ul
        aria-label="Orders containing your products"
        className="divide-y rounded-xl border bg-card md:rounded-t-none"
      >
        {orders.map((order) => (
          <OrderRow
            key={order.id}
            order={order}
            saving={savingId === order.id}
            onChangeStatus={onChangeStatus}
          />
        ))}
      </ul>
    </div>
  )
}
