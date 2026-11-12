import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageState } from '@/components/PageState'
import { Button } from '@/components/ui/button'
import {
  CartProvider,
  CartView,
  groupCartByProducer,
  useCart,
} from '@/features/cart/cart'
import { CartNotice } from '@/features/cart/cart/components/CartNotice'

function CartPageContent() {
  const {
    items,
    loading,
    error,
    notice,
    saving,
    reload,
    setQuantity,
    removeLine,
  } = useCart()

  const groups = useMemo(() => groupCartByProducer(items), [items])
  const showEmpty = !loading && !error && items.length === 0

  return (
    <section aria-labelledby="cart-heading" className="vstack gap-4">
      <header className="d-flex flex-wrap align-items-end justify-content-between gap-3">
        <div className="vstack gap-1">
          <h1 id="cart-heading" className="mb-0">Your cart</h1>
          {!loading && !error && items.length > 0 && (
            <p className="text-body-secondary mb-0">
              {items.length} {items.length === 1 ? 'product' : 'products'} from{' '}
              {groups.length} {groups.length === 1 ? 'producer' : 'producers'}
            </p>
          )}
        </div>
        {!loading && !error && items.length > 0 && (
          <Link
            to="/"
            className="small text-body-secondary"
          >
            Continue shopping
          </Link>
        )}
      </header>

      {notice && <CartNotice message={notice} />}

      <PageState
        loading={loading}
        error={error}
        errorMessage={error ?? undefined}
        onRetry={reload}
        empty={showEmpty}
        emptyMessage="Your cart is empty. Browse the catalog and add fresh produce to get started."
      >
        <CartView
          groups={groups}
          saving={saving}
          onQuantityChange={setQuantity}
          onRemove={removeLine}
        />
      </PageState>

      {showEmpty && (
        <div className="d-flex justify-content-center">
          <Button asChild>
            <Link to="/">Browse the catalog</Link>
          </Button>
        </div>
      )}
    </section>
  )
}

export default function CartPage() {
  return (
    <CartProvider>
      <CartPageContent />
    </CartProvider>
  )
}
