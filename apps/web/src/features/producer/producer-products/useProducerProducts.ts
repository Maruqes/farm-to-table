import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/services/api'
import { adaptProducerProduct } from './producer-products.adapter'
import { producerProductsService } from './producer-products.service'
import type { ProducerProductDto as ProductDto } from './producer-products.dto'
import type {
  ProducerProduct,
  ProductInput,
  SaveProductResult,
} from './producer-products.types'

const LOAD_ERROR =
  'Your products could not be loaded. Check your connection and try again.'

interface AttachedImage {
  dto: ProductDto
  imageError: boolean
}

async function attachImage(
  id: string,
  file: File | null,
  dto: ProductDto,
): Promise<AttachedImage> {
  if (!file) return { dto, imageError: false }
  if (!id) return { dto, imageError: true }

  try {
    const imageUrl = await producerProductsService.uploadImage(id, file)
    return { dto: { ...dto, imageUrl }, imageError: !imageUrl }
  } catch {
    // The product is saved; only the photo failed. The view tells the producer to retry.
    return { dto, imageError: true }
  }
}

function toProduct(dto: ProductDto): ProducerProduct {
  return adaptProducerProduct(dto)
}

export function useProducerProducts() {
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
          dtos
            .map(toProduct)
            .filter((product) => product.id.length > 0),
        )
        setError(null)
        setLoadedKey(requestKey)
      })
      .catch((cause: unknown) => {
        if (!active) return
        const apiError = cause instanceof ApiError ? cause : null
        setProducts([])
        setError(apiError?.message ?? LOAD_ERROR)
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

  const createProduct = useCallback(
    async (input: ProductInput, image: File | null): Promise<SaveProductResult> => {
      const created = await producerProductsService.create(input)
      const attached = await attachImage(created.id ?? created._id ?? '', image, created)
      const product = toProduct(attached.dto)
      setProducts((current) => [product, ...current])
      return { product, imageError: attached.imageError }
    },
    [],
  )

  const updateProduct = useCallback(
    async (
      id: string,
      input: ProductInput,
      image: File | null,
    ): Promise<SaveProductResult> => {
      const updated = await producerProductsService.update(id, input)
      const attached = await attachImage(id, image, updated)
      const product = toProduct(attached.dto)
      setProducts((current) =>
        current.map((item) => (item.id === id ? product : item)),
      )
      return { product, imageError: attached.imageError }
    },
    [],
  )

  const removeProduct = useCallback(async (id: string): Promise<void> => {
    await producerProductsService.remove(id)
    setProducts((current) => current.filter((item) => item.id !== id))
  }, [])

  return {
    products,
    loading,
    error,
    empty: !loading && !error && products.length === 0,
    reload,
    createProduct,
    updateProduct,
    removeProduct,
  }
}
