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
    <li className="board-row pa-order-row">
      <div className="min-w-0 vstack gap-1">
        <div className="d-flex flex-wrap align-items-baseline gap-2">
          <h2 id={headingId}>
            Order{' '}
            <data value={order.id} title={order.id} className="tabular">
              {shortOrderRef(order.id)}
            </data>
          </h2>
          {order.createdAt && (
            <span className="small text-body-secondary">
              Placed <time dateTime={order.createdAt}>{formatDate(order.createdAt)}</time>
            </span>
          )}
        </div>

        <p>
          {order.buyer.name}
          <span className="text-body-secondary">
            {' '}
            · {fulfilmentLabel(order.fulfilment.method)}
          </span>
        </p>

        {order.fulfilment.method === 'delivery' && order.fulfilment.address && (
          <p className="text-break small text-body-secondary">
            {order.fulfilment.address}
          </p>
        )}

        {order.items.length > 0 && (
          <p className="text-break small text-body-secondary">
            {order.items
              .map((item) => `${item.name} × ${item.quantity} ${item.unit}`)
              .join(', ')}
          </p>
        )}
      </div>

      <div className="d-flex align-items-baseline justify-content-between gap-2 pa-md-block">
        <span className="label-line pa-col-label">Total</span>
        <data value={order.total} className="price tabular">
          {formatMoney(order.total)}
        </data>
      </div>

      <div className="d-flex align-items-center justify-content-between gap-2 pa-md-block">
        <span className="label-line pa-col-label">Status</span>
        <Badge variant={statusBadgeVariant(order.status)}>
          {ORDER_STATUS_LABELS[order.status]}
        </Badge>
      </div>

      {(next || cancellable) && (
        <div className="pa-order-actions">
          {next && (
            <div className="vstack gap-1">
              <label htmlFor={selectId} className="visually-hidden">
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
                className="form-select"
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
              onClick={() => setConfirmingCancel(true)}
              disabled={saving}
              aria-label={`Cancel order ${shortOrderRef(order.id)}`}
            >
              <X size={16} aria-hidden="true" />
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
          className="frame-alarm p-3 pa-confirm-span"
        >
          <p id={`${confirmId}-title`} className="fw-semibold">
            Cancel order {shortOrderRef(order.id)}?
          </p>
          <p
            id={`${confirmId}-description`}
            className="mt-1 small text-body-secondary"
          >
            The buyer is told straight away and the stock returns to your catalog.
            Cancelling cannot be undone.
          </p>
          <div className="d-flex flex-wrap gap-2 mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
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
        className="label-line d-none d-md-grid pa-order-head py-2"
      >
        <span>Order</span>
        <span>Total</span>
        <span>Status</span>
        <span>Actions</span>
      </div>

      <ul aria-label="Orders containing your products" className="board">
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
