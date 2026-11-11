import { useCallback, useEffect, useState } from 'react'
import { adaptProducerProduct } from '@/features/producer/producer-products/producer-products.adapter'
import { producerProductsService } from '@/features/producer/producer-products/producer-products.service'
import type { ProducerProduct } from '@/features/producer/producer-products/producer-products.types'
import { ApiError } from '@/services/api'

const LOAD_ERROR =
  'Your products could not be loaded. Check your connection and try again.'

export function useAuctionProductOptions() {
  const [products, setProducts] = useState<ProducerProduct[]>([])
  const [loadedKey, setLoadedKey] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const requestKey = `products|${attempt}`
  const loading = loadedKey !== requestKey

  useEffect(() => {
    let active = true

    producerProductsService
      .listMine()
      .then((dtos) => {
        if (!active) return
        setProducts(
          dtos.map(adaptProducerProduct).filter((product) => product.id.length > 0),
        )
        setError(null)
        setLoadedKey(requestKey)
      })
      .catch((cause: unknown) => {
        if (!active) return
        setProducts([])
        setError(cause instanceof ApiError ? cause.message : LOAD_ERROR)
        setLoadedKey(requestKey)
      })

    return () => {
      active = false
    }
  }, [requestKey])

  const reload = useCallback(() => {
    setError(null)
    setAttempt((value) => value + 1)
  }, [])

  return { products, loading, error, reload }
}
