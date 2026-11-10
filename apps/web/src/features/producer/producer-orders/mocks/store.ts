import type { ProducerOrderDto } from '../producer-orders.dto'
import { createMockLiveOrder, createMockProducerOrders } from './orders'

const STORAGE_KEY = 'ftt.producer-orders.store'

export type MockOrderEvent =
  | { type: 'order-updated'; orderId: string; status: string; updatedAt: string }
  | { type: 'order-created'; order: ProducerOrderDto }

type MockOrderListener = (event: MockOrderEvent) => void

const listeners = new Set<MockOrderListener>()
let store: ProducerOrderDto[] | null = null
let known = new Map<string, string>()
let liveSequence = 0

function clone<T>(value: T): T {
  return structuredClone(value)
}

function orderKey(order: ProducerOrderDto): string {
  return String(order.id ?? order._id ?? '')
}

function readStorage(): ProducerOrderDto[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as ProducerOrderDto[]) : null
  } catch {
    return null
  }
}

function writeStorage(orders: ProducerOrderDto[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
  } catch {
    // The list still works for this session when storage is unavailable.
  }
}

function snapshot(orders: ProducerOrderDto[]): Map<string, string> {
  const statuses = new Map<string, string>()
  for (const order of orders) {
    const key = orderKey(order)
    if (key) statuses.set(key, String(order.status ?? 'pending'))
  }
  return statuses
}

function seed(): ProducerOrderDto[] {
  if (store) return store

  const stored = readStorage()
  store = stored ?? createMockProducerOrders()
  if (!stored) writeStorage(store)
  known = snapshot(store)
  return store
}

function commit(orders: ProducerOrderDto[]): void {
  store = orders
  known = snapshot(orders)
  writeStorage(orders)
}

function emit(event: MockOrderEvent): void {
  for (const listener of listeners) listener(event)
}

export function listMockOrders(): ProducerOrderDto[] {
  return clone(seed())
}

export function subscribeMockOrders(listener: MockOrderListener): () => void {
  listeners.add(listener)
  seed()
  return () => {
    listeners.delete(listener)
  }
}

export function updateMockOrderStatus(
  id: string,
  status: string,
): ProducerOrderDto | null {
  const orders = seed()
  const order = orders.find((entry) => orderKey(entry) === id)
  if (!order) return null

  order.status = status
  order.updatedAt = new Date().toISOString()
  commit(orders)
  emit({
    type: 'order-updated',
    orderId: id,
    status,
    updatedAt: order.updatedAt,
  })
  return clone(order)
}

export function addMockOrder(order: ProducerOrderDto): ProducerOrderDto {
  const orders = seed()
  const key = orderKey(order)
  const existing = key
    ? orders.findIndex((entry) => orderKey(entry) === key)
    : -1

  if (existing >= 0) orders.splice(existing, 1, order)
  else orders.unshift(order)

  commit(orders)
  emit({ type: 'order-created', order: clone(order) })
  return clone(order)
}

// Moves the most recent open order one step forward, as another tab or buyer would.
export function advanceMockOrder(): boolean {
  // Oldest open order first, so the newest pending order stays cancellable for longer.
  const order = seed().findLast(
    (entry) =>
      entry.status === 'pending' ||
      entry.status === 'confirmed' ||
      entry.status === 'ready',
  )
  if (!order) return false

  const next =
    order.status === 'pending'
      ? 'confirmed'
      : order.status === 'confirmed'
        ? 'ready'
        : 'delivered'

  updateMockOrderStatus(orderKey(order), next)
  return true
}

export function createNextMockLiveOrder(): ProducerOrderDto {
  liveSequence += 1
  return createMockLiveOrder(liveSequence)
}

// In mock mode, a change made in another tab is broadcast by the browser to this one.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return

    const next = readStorage()
    if (!next) return

    const previous = store ? known : new Map<string, string>()
    const nextKnown = snapshot(next)
    store = next

    for (const [key, status] of nextKnown) {
      const before = previous.get(key)
      if (before === undefined) {
        const order = next.find((entry) => orderKey(entry) === key)
        if (order) emit({ type: 'order-created', order: clone(order) })
        continue
      }
      if (before === status) continue

      const order = next.find((entry) => orderKey(entry) === key)
      emit({
        type: 'order-updated',
        orderId: key,
        status,
        updatedAt: String(order?.updatedAt ?? ''),
      })
    }

    known = nextKnown
  })
}
