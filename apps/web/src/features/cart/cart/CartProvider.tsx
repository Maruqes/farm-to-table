import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useSession } from '@/context/session'
import { ApiError } from '@/services/api'
import { CartContext } from './cart-context'
import { cartService } from './cart.service'
import type { CartItem, CartLineInput } from './cart.types'

const SAVE_DELAY_MS = 350
const LOAD_ERROR =
  'Your cart could not be loaded. Check your connection and try again.'
const SAVE_ERROR =
  'We could not update your cart. Your last change was undone. Please try again.'
const STOCK_ERROR =
  'Stock changed while you were shopping. We refreshed your cart with the latest quantities.'

function toLines(items: CartItem[]): CartLineInput[] {
  return items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
  }))
}

function clampQuantity(quantity: number, stock: number): number {
  const upper = Math.max(1, stock)
  return Math.min(Math.max(1, Math.floor(quantity)), upper)
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useSession()
  const userId = user?.id ?? ''

  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(() => userId !== '')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const lastSavedRef = useRef<CartItem[]>([])
  const pendingRef = useRef<CartItem[] | null>(null)
  const timerRef = useRef<number | null>(null)
  const savingRef = useRef(false)

  const loadCart = useCallback(async (id: string, quiet = false) => {
    try {
      const cart = await cartService.getCart(id)
      lastSavedRef.current = cart.items
      pendingRef.current = null
      setItems(cart.items)
      setError(null)
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : LOAD_ERROR)
    } finally {
      if (!quiet) setLoading(false)
    }
  }, [])

  const flush = useCallback(async () => {
    const id = userId
    if (!id || savingRef.current) return

    savingRef.current = true
    setSaving(true)
    try {
      while (pendingRef.current) {
        const next = pendingRef.current
        pendingRef.current = null

        try {
          const saved = await cartService.updateCart(id, toLines(next))
          lastSavedRef.current = saved.items
          if (!pendingRef.current) setItems(saved.items)
          setNotice(null)
        } catch (cause) {
          const apiError = cause instanceof ApiError ? cause : null
          pendingRef.current = null
          if (apiError?.status === 409 || apiError?.code === 'STOCK_CHANGED') {
            setNotice(STOCK_ERROR)
            await loadCart(id, true)
          } else {
            setItems(lastSavedRef.current)
            setNotice(apiError?.message ?? SAVE_ERROR)
          }
          break
        }
      }
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }, [userId, loadCart])

  const commit = useCallback(
    (next: CartItem[]) => {
      setItems(next)
      pendingRef.current = next
      if (!userId) return

      if (timerRef.current != null) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null
        void flush()
      }, SAVE_DELAY_MS)
    },
    [userId, flush],
  )

  useEffect(() => {
    if (!userId) return
    let active = true

    cartService
      .getCart(userId)
      .then((cart) => {
        if (!active) return
        lastSavedRef.current = cart.items
        pendingRef.current = null
        setItems(cart.items)
        setError(null)
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof ApiError ? cause.message : LOAD_ERROR)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
      const pending = pendingRef.current
      pendingRef.current = null
      if (pending) {
        void cartService.updateCart(userId, toLines(pending)).catch(() => {
          // Best effort when leaving the page; the next visit reloads the server state.
        })
      }
    }
  }, [userId])

  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      const next = items.map((item) =>
        item.productId === productId
          ? { ...item, quantity: clampQuantity(quantity, item.stock) }
          : item,
      )
      commit(next)
    },
    [items, commit],
  )

  const removeLine = useCallback(
    (productId: string) => {
      commit(items.filter((item) => item.productId !== productId))
    },
    [items, commit],
  )

  const reload = useCallback(() => {
    if (!userId) return
    setLoading(true)
    setError(null)
    void loadCart(userId)
  }, [userId, loadCart])

  const value = useMemo(
    () => ({
      items,
      loading,
      error,
      notice,
      saving,
      reload,
      setQuantity,
      removeLine,
    }),
    [items, loading, error, notice, saving, reload, setQuantity, removeLine],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
