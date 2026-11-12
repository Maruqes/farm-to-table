import { Badge } from '@/components/ui/badge'
import { formatDate, formatMoney } from '@/services/format'
import {
  ORDER_STATUS_LABELS,
  shortOrderRef,
} from '../admin-orders.labels'
import type {
  AdminOrder,
  AdminOrderStatus,
} from '../admin-orders.types'

function statusBadgeVariant(
  status: AdminOrderStatus,
): 'secondary' | 'destructive' | 'outline' {
  if (status === 'delivered') return 'secondary'
  if (status === 'cancelled') return 'destructive'
  return 'outline'
}

function OrderStatusBadge({ status }: { status: AdminOrderStatus }) {
  return (
    <Badge variant={statusBadgeVariant(status)}>
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  )
}

function PlacedDate({ createdAt }: { createdAt: string | null }) {
  if (!createdAt) return <span>—</span>
  return <time dateTime={createdAt}>{formatDate(createdAt)}</time>
}

interface OrdersTableProps {
  orders: AdminOrder[]
}

export function OrdersTable({ orders }: OrdersTableProps) {
  return (
    <table className="table">
      <caption className="sr-only">
        All orders with buyer, producer, item count, total, state and date
        placed
      </caption>
      <thead>
        <tr>
          <th scope="col">Order</th>
          <th scope="col" className="hidden md:table-cell">
            Buyer
          </th>
          <th scope="col" className="hidden md:table-cell">
            Producer
          </th>
          <th scope="col" className="hidden md:table-cell text-right">
            Items
          </th>
          <th scope="col" className="text-right">
            Total
          </th>
          <th scope="col">Status</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order.id}>
            <th scope="row" className="text-base font-normal normal-case tracking-normal text-ink">
              <span className="block font-semibold">
                Order{' '}
                <data
                  value={order.id}
                  title={order.id}
                  className="tabular"
                >
                  {shortOrderRef(order.id)}
                </data>
              </span>
              <span className="block text-sm text-dim">
                Placed{' '}
                <PlacedDate createdAt={order.createdAt} />
              </span>
              <span className="block text-sm md:hidden mt-1">
                {order.buyerName} · {order.producerName}
              </span>
              <span className="block text-sm text-dim md:hidden">
                {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
              </span>
            </th>
            <td className="hidden md:table-cell break-words">{order.buyerName}</td>
            <td className="hidden md:table-cell break-words">
              {order.producerName}
            </td>
            <td className="hidden md:table-cell text-right tabular">
              {order.itemCount}
            </td>
            <td className="text-right font-display whitespace-nowrap tabular">
              {formatMoney(order.total)}
            </td>
            <td>
              <OrderStatusBadge status={order.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
