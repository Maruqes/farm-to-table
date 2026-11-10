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
    <>
      <ul
        aria-label="All orders"
        className="space-y-3 md:hidden"
      >
        {orders.map((order) => (
          <li key={order.id} className="rounded-xl border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">
                  Order{' '}
                  <data
                    value={order.id}
                    title={order.id}
                    className="tabular"
                  >
                    {shortOrderRef(order.id)}
                  </data>
                </p>
                <p className="text-sm text-muted-foreground">
                  Placed{' '}
                  <PlacedDate createdAt={order.createdAt} />
                </p>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
              <div className="min-w-0">
                <dt className="text-muted-foreground">Buyer</dt>
                <dd className="break-words font-medium">{order.buyerName}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-muted-foreground">Producer</dt>
                <dd className="break-words font-medium">
                  {order.producerName}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Items</dt>
                <dd className="tabular">{order.itemCount}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Total</dt>
                <dd className="font-display font-extrabold tabular">
                  {formatMoney(order.total)}
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
        <table className="w-full table-fixed border-collapse text-left">
          <caption className="sr-only">
            All orders with buyer, producer, item count, total, state and date
            placed
          </caption>
          <thead className="bg-muted/40 text-sm text-muted-foreground">
            <tr>
              <th scope="col" className="w-[22%] px-4 py-3 font-medium">
                Order
              </th>
              <th scope="col" className="w-[22%] px-3 py-3 font-medium">
                Buyer
              </th>
              <th scope="col" className="w-[22%] px-3 py-3 font-medium">
                Producer
              </th>
              <th
                scope="col"
                className="w-[10%] px-3 py-3 text-right font-medium"
              >
                Items
              </th>
              <th
                scope="col"
                className="w-[12%] px-3 py-3 text-right font-medium"
              >
                Total
              </th>
              <th scope="col" className="w-[12%] px-3 py-3 font-medium">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((order) => (
              <tr key={order.id} className="align-top hover:bg-accent/40">
                <th scope="row" className="px-4 py-3 font-normal">
                  <span className="block font-medium">
                    <data
                      value={order.id}
                      title={order.id}
                      className="tabular"
                    >
                      {shortOrderRef(order.id)}
                    </data>
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    <PlacedDate createdAt={order.createdAt} />
                  </span>
                </th>
                <td className="px-3 py-3 break-words">{order.buyerName}</td>
                <td className="px-3 py-3 break-words">
                  {order.producerName}
                </td>
                <td className="px-3 py-3 text-right tabular">
                  {order.itemCount}
                </td>
                <td className="px-3 py-3 text-right font-display font-extrabold whitespace-nowrap tabular">
                  {formatMoney(order.total)}
                </td>
                <td className="px-3 py-3">
                  <OrderStatusBadge status={order.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
