import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from '@/context/session'
import { ApiError } from '@/services/api'
import {
  adaptOrderCreated,
  adaptOrderStatusUpdate,
  adaptProducerOrder,
  adaptProducerOrders,
} from './producer-orders.adapter'
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STEPS,
  shortOrderRef,
} from './producer-orders.labels'
import { createProducerOrdersRealtime } from './producer-orders.realtime'
import { producerOrdersService } from './producer-orders.service'
import type {
  OrderActionResult,
  OrderStatus,
  OrderStatusUpdate,
  ProducerOrder,
} from './producer-orders.types'

const LOAD_ERROR =
  'Your orders could not be loaded. Check your connection and try again.'
const UPDATE_ERROR =
  'The status change could not be saved. Check your connection and try again.'

function rank(status: OrderStatus): number {
  return ORDER_STATUS_STEPS.indexOf(status)
}

function isAllowedUpdate(current: OrderStatus, next: OrderStatus): boolean {
  if (current === next || current === 'cancelled') return false

  // SCOPE.md §0: states only move forward. A cancel is only valid from pending.
  if (next === 'cancelled') return current === 'pending'
  return rank(next) > rank(current)
}

function applyStatusUpdate(
  orders: ProducerOrder[],
  update: OrderStatusUpdate,
): ProducerOrder[] {
  return orders.map((order) => {
    if (order.id !== update.orderId) return order
    if (!isAllowedUpdate(order.status, update.status)) return order
    return { ...order, status: update.status }
  })
}

export function useProducerOrders() {
  const { user } = useSession()
  const userId = user?.id ?? ''

  const [orders, setOrders] = useState<ProducerOrder[]>([])
  const [loadedKey, setLoadedKey] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const ordersRef = useRef<ProducerOrder[]>([])

  const requestKey = `orders|${attempt}`
  const loading = loadedKey !== requestKey

  useEffect(() => {
    ordersRef.current = orders
  }, [orders])

  useEffect(() => {
    if (!userId) return

    let active = true

    producerOrdersService
      .listMine()
      .then((dtos) => {
        if (!active) return
        setOrders(adaptProducerOrders(dtos))
        setError(null)
        setLoadedKey(requestKey)
      })
      .catch((cause: unknown) => {
        if (!active) return
        const apiError = cause instanceof ApiError ? cause : null
        setOrders([])
        setError(apiError?.message ?? LOAD_ERROR)
        setLoadedKey(requestKey)
      })

    return () => {
      active = false
    }
  }, [requestKey, userId])

  useEffect(() => {
    if (!userId) return

    const realtime = createProducerOrdersRealtime()

    return realtime.subscribe(userId, {
      onUpdated(payload) {
        const update = adaptOrderStatusUpdate(payload)
        if (!update) return

        const target = ordersRef.current.find((order) => order.id === update.orderId)
        if (!target || !isAllowedUpdate(target.status, update.status)) return

        setOrders((current) => applyStatusUpdate(current, update))
        setAnnouncement(
          `Order ${shortOrderRef(update.orderId)} is now ${ORDER_STATUS_LABELS[update.status]}.`,
        )
      },
      onCreated(payload) {
        const created = adaptOrderCreated(payload)
        if (!created) return

        setOrders((current) =>
          current.some((order) => order.id === created.id)
            ? current
            : [created, ...current],
        )
        setAnnouncement(`New order from ${created.buyer.name}.`)
      },
    })
  }, [userId])

  const reload = useCallback(() => {
    setError(null)
    setAttempt((value) => value + 1)
  }, [])

  const changeStatus = useCallback(
    async (orderId: string, status: OrderStatus): Promise<OrderActionResult> => {
      if (savingId) {
        return {
          ok: false,
          message: 'Another status change is still saving. Please wait a moment.',
        }
      }

      setSavingId(orderId)
      try {
        const dto = await producerOrdersService.updateStatus(orderId, status)
        const adapted = adaptProducerOrder(dto)
        const order = dto.id || dto._id ? adapted : { ...adapted, id: orderId }
        setOrders((current) =>
          current.map((item) => (item.id === orderId ? order : item)),
        )
        setAnnouncement(
          `Order ${shortOrderRef(orderId)} is now ${ORDER_STATUS_LABELS[order.status]}.`,
        )
        return { ok: true }
      } catch (cause) {
        return {
          ok: false,
          message: cause instanceof ApiError ? cause.message : UPDATE_ERROR,
        }
      } finally {
        setSavingId(null)
      }
    },
    [savingId],
  )

  return {
    orders,
    loading,
    error,
    empty: !loading && !error && orders.length === 0,
    savingId,
    announcement,
    reload,
    changeStatus,
  }
}
