import { USE_MOCKS } from '@/services/env'
import { createRealtimeClient, userRoom } from '@/services/realtime'
import type {
  OrderCreatedEventDto,
  OrderStatusUpdatedEventDto,
} from './producer-orders.dto'
import {
  addMockOrder,
  advanceMockOrder,
  createNextMockLiveOrder,
  subscribeMockOrders,
} from './mocks/store'

export interface ProducerOrdersRealtimeHandlers {
  onUpdated: (dto: OrderStatusUpdatedEventDto) => void
  onCreated: (dto: OrderCreatedEventDto) => void
}

export interface ProducerOrdersRealtime {
  subscribe(userId: string, handlers: ProducerOrdersRealtimeHandlers): () => void
}

// Slow enough that a producer can try the controls before the mock moves an order.
const FIRST_EVENT_MS = 20000
const EVENT_INTERVAL_MS = 25000

function subscribeMock(
  _userId: string,
  handlers: ProducerOrdersRealtimeHandlers,
): () => void {
  const stopStore = subscribeMockOrders((event) => {
    if (event.type === 'order-updated') {
      handlers.onUpdated({
        orderId: event.orderId,
        status: event.status,
        updatedAt: event.updatedAt,
      })
      return
    }
    handlers.onCreated({ order: event.order })
  })

  let tick = 0
  const runTick = () => {
    tick += 1
    if (tick % 3 === 0 || !advanceMockOrder()) {
      addMockOrder(createNextMockLiveOrder())
    }
  }

  const first = setTimeout(runTick, FIRST_EVENT_MS)
  const interval = setInterval(runTick, EVENT_INTERVAL_MS)

  return () => {
    clearTimeout(first)
    clearInterval(interval)
    stopStore()
  }
}

function subscribeSocket(
  userId: string,
  handlers: ProducerOrdersRealtimeHandlers,
): () => void {
  const client = createRealtimeClient()
  const room = userRoom(userId)
  client.join(room)

  const offUpdated = client.on<OrderStatusUpdatedEventDto>(
    'order-updated',
    handlers.onUpdated,
  )
  const offCreated = client.on<OrderCreatedEventDto>(
    'order-created',
    handlers.onCreated,
  )

  return () => {
    offUpdated()
    offCreated()
    client.leave(room)
    client.disconnect()
  }
}

// In mock mode the store also listens to localStorage, so a status change made in
// another tab reaches this page through the same handlers.
export function createProducerOrdersRealtime(): ProducerOrdersRealtime {
  return { subscribe: USE_MOCKS ? subscribeMock : subscribeSocket }
}
