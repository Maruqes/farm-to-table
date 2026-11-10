import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/services/api'
import { productDetailService } from './product-detail.service'
import type { ProductDetail } from './product-detail.types'

interface ProductDetailResult {
  product: ProductDetail | null
  loading: boolean
  error: string | null
  notFound: boolean
  reload: () => void
}

interface ProductDetailSnapshot {
  key: string
  product: ProductDetail | null
  error: string | null
  notFound: boolean
}

const LOAD_ERROR = 'This product could not be loaded. Check your connection and try again.'

export function useProductDetail(id: string): ProductDetailResult {
  const [attempt, setAttempt] = useState(0)
  const [snapshot, setSnapshot] = useState<ProductDetailSnapshot>({
    key: '',
    product: null,
    error: null,
    notFound: false,
  })

  const requestKey = `${id}|${attempt}`

  useEffect(() => {
    let active = true

    productDetailService
      .getProduct(id)
      .then((product) => {
        if (active) {
          setSnapshot({ key: requestKey, product, error: null, notFound: false })
        }
      })
      .catch((cause: unknown) => {
        if (!active) return
        const apiError = cause instanceof ApiError ? cause : null
        const notFound =
          apiError?.status === 404 || apiError?.code === 'PRODUCT_NOT_FOUND'
        setSnapshot({
          key: requestKey,
          product: null,
          error: notFound ? null : (apiError?.message ?? LOAD_ERROR),
          notFound,
        })
      })

    return () => {
      active = false
    }
  }, [requestKey, id])

  const reload = useCallback(() => {
    setAttempt((value) => value + 1)
  }, [])

  const current = snapshot.key === requestKey

  return {
    product: current ? snapshot.product : null,
    loading: !current,
    error: current ? snapshot.error : null,
    notFound: current ? snapshot.notFound : false,
    reload,
  }
}
