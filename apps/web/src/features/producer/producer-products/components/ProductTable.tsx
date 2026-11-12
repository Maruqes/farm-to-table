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
        className="label-line d-none d-md-grid pa-product-head px-0 py-2"
      >
        <span>Product</span>
        <span>Price</span>
        <span>Stock</span>
        <span className="text-end">Actions</span>
      </div>

      <ul aria-label="Your products" className="board">
        {products.map((product) => {
          const confirming = confirmingId === product.id
          const deleting = deletingId === product.id
          const titleId = `delete-title-${product.id}`
          const descriptionId = `delete-desc-${product.id}`

          return (
            <li key={product.id} className="board-row pa-product-row">
              <div className="d-flex min-w-0 align-items-center gap-3">
                <CrateChip category={product.category} />
                <span aria-hidden="true" className="lot">
                  {lotNumber(product.id)}
                </span>

                <div className="min-w-0">
                  <p className="text-break fw-semibold">{product.name}</p>
                  <div className="d-flex flex-wrap align-items-center gap-2 mt-1 small text-body-secondary">
                    <span>{categoryLabel(product.category)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{seasonLabel(product.season)}</span>
                    {product.organic && <Badge variant="secondary">Organic</Badge>}
                    {product.stock === 0 && <Badge variant="outline">Out of stock</Badge>}
                  </div>
                </div>
              </div>

              <div className="d-flex align-items-baseline justify-content-between gap-2 pa-md-block">
                <span className="label-line pa-col-label">Price</span>
                <span>
                  <data value={product.price} className="price tabular">
                    {formatMoney(product.price)}
                  </data>{' '}
                  <span className="d-block pa-xs text-body-secondary">
                    per {product.unit}
                  </span>
                </span>
              </div>

              <div className="d-flex align-items-baseline justify-content-between gap-2 pa-md-block">
                <span className="label-line pa-col-label">Stock</span>
                <span className="text-nowrap">
                  <data value={product.stock} className="tabular fw-semibold">
                    {product.stock}
                  </data>{' '}
                  <span className="pa-xs text-body-secondary">{product.unit}</span>
                </span>
              </div>

              <div className="pa-actions">
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
                  className="frame-alarm p-3 pa-confirm-span"
                >
                  <p id={titleId} className="fw-semibold">
                    Delete {product.name}?
                  </p>
                  <p id={descriptionId} className="mt-1 small text-body-secondary">
                    This removes it from your catalog and the shop. Orders already placed
                    keep their copy.
                  </p>
                  <div className="d-flex flex-wrap gap-2 mt-3">
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
