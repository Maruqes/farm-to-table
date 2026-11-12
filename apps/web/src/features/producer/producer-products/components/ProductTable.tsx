import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CrateChip } from '@/components/board'
import { lotNumber } from '@/components/crate'
import { categoryLabel } from '@/features/catalog/home-catalog/catalog-options'
import { formatMoney } from '@/services/format'
import { seasonLabel } from '../producer-products-options'
import type { ProducerProduct } from '../producer-products.types'

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
        className="label-line hidden px-0 py-2 md:grid md:grid-cols-[minmax(0,1fr)_7rem_6rem_12rem] md:items-center"
      >
        <span>Product</span>
        <span>Price</span>
        <span>Stock</span>
        <span className="text-right">Actions</span>
      </div>

      <ul aria-label="Your products" className="board">
        {products.map((product) => {
          const confirming = confirmingId === product.id
          const deleting = deletingId === product.id
          const titleId = `delete-title-${product.id}`
          const descriptionId = `delete-desc-${product.id}`

          return (
            <li key={product.id} className="board-row grid gap-4 md:grid-cols-[minmax(0,1fr)_7rem_6rem_12rem] md:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <CrateChip category={product.category} />
                <span aria-hidden="true" className="lot">
                  {lotNumber(product.id)}
                </span>

                <div className="min-w-0">
                  <p className="break-words font-semibold">{product.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-dim">
                    <span>{categoryLabel(product.category)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{seasonLabel(product.season)}</span>
                    {product.organic && <Badge variant="secondary">Organic</Badge>}
                    {product.stock === 0 && <Badge variant="outline">Out of stock</Badge>}
                  </div>
                </div>
              </div>

              <div className="flex items-baseline justify-between gap-2 md:block">
                <span className="label-line md:sr-only">Price</span>
                <span>
                  <data value={product.price} className="price tabular">
                    {formatMoney(product.price)}
                  </data>{' '}
                  <span className="block text-xs text-dim">
                    per {product.unit}
                  </span>
                </span>
              </div>

              <div className="flex items-baseline justify-between gap-2 md:block">
                <span className="label-line md:sr-only">Stock</span>
                <span className="text-nowrap">
                  <data value={product.stock} className="tabular font-semibold">
                    {product.stock}
                  </data>{' '}
                  <span className="text-xs text-dim">{product.unit}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setConfirmingId(null)
                    onEdit(product)
                  }}
                  aria-label={`Edit ${product.name}`}
                >
                  <Pencil size={16} aria-hidden="true" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmingId(product.id)}
                  aria-label={`Delete ${product.name}`}
                >
                  <Trash2 size={16} aria-hidden="true" />
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
                  className="frame-alarm p-3 md:col-span-full"
                >
                  <p id={titleId} className="font-semibold">
                    Delete {product.name}?
                  </p>
                  <p id={descriptionId} className="mt-1 text-sm text-dim">
                    This removes it from your catalog and the shop. Orders already placed
                    keep their copy.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
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
