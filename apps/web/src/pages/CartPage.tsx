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
    <section aria-labelledby="cart-heading" className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 id="cart-heading">Your cart</h1>
          {!loading && !error && items.length > 0 && (
            <p className="text-muted-foreground">
              {items.length} {items.length === 1 ? 'product' : 'products'} from{' '}
              {groups.length} {groups.length === 1 ? 'producer' : 'producers'}
            </p>
          )}
        </div>
        {!loading && !error && items.length > 0 && (
          <Link
            to="/"
            className="text-sm font-medium text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
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
        <div className="flex justify-center">
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
