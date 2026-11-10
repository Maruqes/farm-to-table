import type {
  AdminOrderDto,
  AdminOrdersPageDto,
} from './admin-orders.dto'
import { ORDER_STATUS_LABELS } from './admin-orders.labels'
import type {
  AdminOrder,
  AdminOrderStatus,
  AdminOrdersPage,
} from './admin-orders.types'

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function roundMoney(value: number): number {
  return Math.round(Math.max(0, value) * 100) / 100
}

function asDate(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  return Number.isNaN(Date.parse(value)) ? null : value
}

function asStatus(value: unknown): AdminOrderStatus {
  const status = asString(value).toLowerCase()
  return Object.prototype.hasOwnProperty.call(ORDER_STATUS_LABELS, status)
    ? (status as AdminOrderStatus)
    : 'pending'
}

function asPartyName(
  party: AdminOrderDto['buyer'],
  fallback: string,
): string {
  if (typeof party === 'string') return asString(party, fallback)
  if (party && typeof party === 'object') return asString(party.name, fallback)
  return fallback
}

function asItemCount(dto: AdminOrderDto | null | undefined): number {
  const reported = asNumber(dto?.itemCount, Number.NaN)
  if (Number.isFinite(reported) && reported >= 0) {
    return Math.floor(reported)
  }
  return Array.isArray(dto?.items) ? dto.items.length : 0
}

export function adaptAdminOrder(
  dto: AdminOrderDto | null | undefined,
  index = 0,
): AdminOrder {
  return {
    id: asString(dto?.id || dto?._id, `order-${index + 1}`),
    buyerName:
      asString(dto?.buyerName) || asPartyName(dto?.buyer, 'Unknown buyer'),
    producerName:
      asString(dto?.producerName) ||
      asPartyName(dto?.producer, 'Unknown producer'),
    itemCount: asItemCount(dto),
    total: roundMoney(asNumber(dto?.total)),
    status: asStatus(dto?.status),
    createdAt: asDate(dto?.createdAt),
  }
}

export function adaptAdminOrdersPage(
  dto: AdminOrdersPageDto | null | undefined,
): AdminOrdersPage {
  const raw = Array.isArray(dto?.items) ? dto.items : []
  const items = raw.map((order, index) => adaptAdminOrder(order, index))
  const reportedTotal =
    typeof dto?.total === 'number' && Number.isFinite(dto.total)
      ? Math.floor(dto.total)
      : items.length

  return {
    items,
    total: Math.max(items.length, reportedTotal, 0),
  }
}
