import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { PageState } from '@/components/PageState'
import { Button } from '@/components/ui/button'
import { useSession } from '@/context/session'
import { cartService } from '@/features/cart/cart'
import { ApiError } from '@/services/api'
import {
  ProductDetailView,
  useProductDetail,
} from '@/features/catalog/product-detail'

export default function ProductDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const { isAuthenticated, user } = useSession()
  const { product, loading, error, notFound, reload } = useProductDetail(id)

  const handleAddToCart = async (product: { id: string }, quantity: number) => {
    if (!user) return
    try {
      // PUT /cart replaces the whole cart, so merge into the current lines.
      const { items } = await cartService.getCart(user.id)
      const lines = items.map(({ productId, quantity }) => ({ productId, quantity }))
      const line = lines.find((item) => item.productId === product.id)
      if (line) line.quantity += quantity
      else lines.push({ productId: product.id, quantity })
      await cartService.updateCart(user.id, lines)
      toast.success('Added to cart')
    } catch (cause) {
      toast.error(
        cause instanceof ApiError ? cause.message : 'Could not add to cart. Please try again.',
      )
    }
  }

  if (notFound) {
    return (
      <div className="flex flex-col gap-6">
        <PageState
          empty
          emptyMessage="We could not find this product. It may have been removed."
        />
        <div className="flex justify-center">
          <Button asChild variant="outline">
            <Link to="/">Back to catalog</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <PageState
      loading={loading}
      error={error}
      errorMessage={error ?? undefined}
      onRetry={reload}
    >
      {product && (
        <ProductDetailView
          key={product.id}
          product={product}
          isAuthenticated={isAuthenticated}
          onAddToCart={handleAddToCart}
        />
      )}
    </PageState>
  )
}
