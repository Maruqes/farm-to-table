import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { PageState } from '@/components/PageState'
import { Button } from '@/components/ui/button'
import { useSession } from '@/context/session'
import {
  ProductDetailView,
  useProductDetail,
} from '@/features/catalog/product-detail'

export default function ProductDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const { isAuthenticated } = useSession()
  const { product, loading, error, notFound, reload } = useProductDetail(id)

  const handleAddToCart = () => {
    toast.success('Added to cart')
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
