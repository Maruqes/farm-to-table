import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CategoryIcon } from '@/features/catalog/home-catalog/components/CategoryIcon'
import { categoryLabel } from '@/features/catalog/home-catalog/catalog-options'
import { formatMoney } from '@/services/format'
import { seasonLabel } from '../producer-products-options'
import type { ProducerProduct } from '../producer-products.types'

const TILE: Record<string, string> = {
  fruit: 'bg-tile-fruit',
  honey: 'bg-tile-honey',
  wine: 'bg-tile-wine',
  cheese: 'bg-tile-cheese',
  bakery: 'bg-tile-bakery',
}

interface ProductTableProps {
  products: ProducerProduct[]
  onEdit: (product: ProducerProduct) => void
  onDelete: (id: string) => Promise<boolean>
}

export function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function confirmDelete(product: ProducerProduct) {
    if (deletingId) return
    setDeletingId(product.id)
    const deleted = await onDelete(product.id)
    setDeletingId(null)
    if (deleted) setConfirmingId((current) => (current === product.id ? null : current))
  }

  return (
    <div>
      <div
        aria-hidden="true"
        className="hidden rounded-t-xl border border-b-0 bg-muted/40 px-4 py-2.5 text-sm font-medium text-muted-foreground md:grid md:grid-cols-[minmax(0,1fr)_7rem_6rem_12rem] md:gap-4"
      >
        <span>Product</span>
        <span>Price</span>
        <span>Stock</span>
        <span className="text-right">Actions</span>
      </div>

      <ul
        aria-label="Your products"
        className="divide-y rounded-xl border bg-card md:rounded-t-none"
      >
        {products.map((product) => {
          const confirming = confirmingId === product.id
          const deleting = deletingId === product.id
          const titleId = `delete-title-${product.id}`
          const descriptionId = `delete-desc-${product.id}`

          return (
            <li
              key={product.id}
              className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_7rem_6rem_12rem] md:items-center md:gap-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`size-14 shrink-0 overflow-hidden rounded-lg ${
                    TILE[product.category] ?? 'bg-tile-veg'
                  }`}
                >
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <CategoryIcon category={product.category} className="size-7" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="break-words font-medium">{product.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                    <span>{categoryLabel(product.category)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{seasonLabel(product.season)}</span>
                    {product.organic && <Badge variant="secondary">Organic</Badge>}
                    {product.stock === 0 && <Badge variant="outline">Out of stock</Badge>}
                  </div>
                </div>
              </div>

              <div className="flex items-baseline justify-between gap-2 md:block">
                <span className="text-sm text-muted-foreground md:sr-only">Price</span>
                <span className="whitespace-nowrap">
                  <data
                    value={product.price}
                    className="font-display text-base font-extrabold tabular"
                  >
                    {formatMoney(product.price)}
                  </data>{' '}
                  <span className="text-xs text-muted-foreground">/ {product.unit}</span>
                </span>
              </div>

              <div className="flex items-baseline justify-between gap-2 md:block">
                <span className="text-sm text-muted-foreground md:sr-only">Stock</span>
                <span className="whitespace-nowrap">
                  <data value={product.stock} className="tabular font-medium">
                    {product.stock}
                  </data>{' '}
                  <span className="text-xs text-muted-foreground">{product.unit}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 px-3"
                  onClick={() => {
                    setConfirmingId(null)
                    onEdit(product)
                  }}
                  aria-label={`Edit ${product.name}`}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 px-3"
                  onClick={() => setConfirmingId(product.id)}
                  aria-label={`Delete ${product.name}`}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete
                </Button>
              </div>

              {confirming && (
                <div
                  role="alertdialog"
                  aria-labelledby={titleId}
                  aria-describedby={descriptionId}
                  aria-busy={deleting}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') setConfirmingId(null)
                  }}
                  className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 md:col-span-4"
                >
                  <p id={titleId} className="font-medium">
                    Delete {product.name}?
                  </p>
                  <p id={descriptionId} className="mt-1 text-sm text-muted-foreground">
                    This removes it from your catalog and the shop. Orders already placed
                    keep their copy.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10"
                      onClick={() => setConfirmingId(null)}
                      disabled={deleting}
                      autoFocus
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="h-10"
                      onClick={() => void confirmDelete(product)}
                      disabled={deleting}
                    >
                      {deleting ? 'Deleting…' : 'Delete product'}
                    </Button>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
