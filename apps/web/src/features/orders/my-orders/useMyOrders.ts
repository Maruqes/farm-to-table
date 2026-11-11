import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from '@/context/session'
import { ApiError } from '@/services/api'
import {
  createRealtimeClient,
  userRoom,
  type RealtimeClient,
} from '@/services/realtime'
import { adaptOrderUpdated } from './my-orders.adapter'
import type { OrderUpdatedEventDto } from './my-orders.dto'
import { ORDER_STATUS_LABELS, ORDER_STATUS_STEPS } from './my-orders.labels'
import { myOrdersService } from './my-orders.service'
import type { MyOrder, OrderStatus, OrderStatusUpdate, RateResult } from './my-orders.types'

const LOAD_ERROR = 'Your orders could not be loaded. Check your connection and try again.'
const RATE_ERROR = 'We could not save your rating. Check your connection and try again.'
const ALREADY_RATED = 'This order has already been rated. Each order can only be rated once.'

function isForwardUpdate(current: OrderStatus, next: OrderStatus): boolean {
  if (current === next || current === 'cancelled') return false
  // SCOPE.md §0: a cancelled order is final; cancelling is only possible while pending.
  if (next === 'cancelled') return current === 'pending'
  return ORDER_STATUS_STEPS.indexOf(next) > ORDER_STATUS_STEPS.indexOf(current)
}

function applyStatusUpdate(orders: MyOrder[], update: OrderStatusUpdate): MyOrder[] {
  let changed = false

  const next = orders.map((order) => {
    if (order.id !== update.orderId) return order

    // Ignore an out-of-order event instead of showing a delivered order go backwards.
    if (!isForwardUpdate(order.status, update.status) && order.status !== update.status) {
      return order
    }

    const history =
      update.updatedAt && !order.history.some((entry) => entry.status === update.status)
        ? [...order.history, { status: update.status, date: update.updatedAt }]
        : order.history

    if (order.status === update.status && history === order.history) return order

    changed = true
    return { ...order, status: update.status, history }
  })

  return changed ? next : orders
}

export function useMyOrders() {
  const { user } = useSession()
  const userId = user?.id ?? ''

  const [orders, setOrders] = useState<MyOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [announcement, setAnnouncement] = useState('')

  const ordersRef = useRef<MyOrder[]>([])
  const clientRef = useRef<RealtimeClient | null>(null)

  useEffect(() => {
    ordersRef.current = orders
  }, [orders])

  useEffect(() => {
    if (!userId) return

    let active = true

    myOrdersService
      .listMine(userId)
      .then((result) => {
        if (active) setOrders(result)
      })
      .catch((cause: unknown) => {
        if (!active) return
        setError(cause instanceof ApiError ? cause.message : LOAD_ERROR)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [userId, attempt])

  useEffect(() => {
    if (!userId) return

    const client = clientRef.current ?? createRealtimeClient()
    clientRef.current = client
    const room = userRoom(userId)
    client.join(room)

    const unsubscribe = client.on<OrderUpdatedEventDto>('order-updated', (payload) => {
      const update = adaptOrderUpdated(payload)
      if (!update) return

      const target = ordersRef.current.find((order) => order.id === update.orderId)
      if (target && isForwardUpdate(target.status, update.status)) {
        setAnnouncement(
          `Order from ${target.producer.name} is now ${ORDER_STATUS_LABELS[update.status]}.`,
        )
      }

      setOrders((current) => applyStatusUpdate(current, update))
    })

    return () => {
      unsubscribe()
      client.leave(room)
      client.disconnect()
    }
  }, [userId])

  const reload = useCallback(() => {
    setLoading(true)
    setError(null)
    setAttempt((value) => value + 1)
  }, [])

  const rateOrder = useCallback(
    async (orderId: string, rating: number, text: string): Promise<RateResult> => {
      if (!userId) {
        return {
          ok: false,
          kind: 'error',
          message: 'Your session has expired. Sign in again to rate your order.',
        }
      }

      const trimmedText = text.trim()

      try {
        await myOrdersService.createReview(userId, {
          orderId,
          rating,
          text: trimmedText,
        })
        setOrders((current) =>
          current.map((order) =>
            order.id === orderId
              ? { ...order, reviewed: true, review: { rating, text: trimmedText } }
              : order,
          ),
        )
        return { ok: true }
      } catch (cause) {
        const apiError = cause instanceof ApiError ? cause : null
        const alreadyRated =
          apiError?.code === 'ALREADY_REVIEWED' ||
          (apiError?.status === 409 && apiError.code !== 'ORDER_NOT_DELIVERED')

        if (alreadyRated) {
          setOrders((current) =>
            current.map((order) =>
              order.id === orderId ? { ...order, reviewed: true } : order,
            ),
          )
          return { ok: false, kind: 'already', message: apiError?.message ?? ALREADY_RATED }
        }

        return { ok: false, kind: 'error', message: apiError?.message ?? RATE_ERROR }
      }
    },
    [userId],
  )

  return {
    orders,
    loading,
    error,
    announcement,
    reload,
    rateOrder,
  }
}
