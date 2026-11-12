import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { PageState } from '@/components/PageState'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/services/api'
import { ProductForm } from './ProductForm'
import { ProductTable } from './ProductTable'
import { useProducerProducts } from '../useProducerProducts'
import type {
  ProductInput,
  ProducerProduct,
  SaveProductResult,
} from '../producer-products.types'

export function ProducerProductsView() {
  const {
    products,
    loading,
    error,
    empty,
    reload,
    createProduct,
    updateProduct,
    removeProduct,
  } = useProducerProducts()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ProducerProduct | null>(null)

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(product: ProducerProduct) {
    setEditing(product)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
  }

  async function handleSave(input: ProductInput, image: File | null): Promise<void> {
    const wasEditing = editing !== null
    let result: SaveProductResult

    if (editing) {
      result = await updateProduct(editing.id, input, image)
    } else {
      result = await createProduct(input, image)
    }

    closeForm()

    if (result.imageError) {
      toast.warning(
        'Product saved, but the photo could not be uploaded. Open Edit and add it again.',
      )
    } else {
      toast.success(wasEditing ? 'Product updated.' : 'Product added to your catalog.')
    }
  }

  async function handleDelete(id: string): Promise<boolean> {
    try {
      await removeProduct(id)
      toast.success('Product deleted.')
      return true
    } catch (cause) {
      toast.error(
        cause instanceof ApiError
          ? cause.message
          : 'The product could not be deleted. Check your connection and try again.',
      )
      return false
    }
  }

  return (
    <section aria-labelledby="producer-products-heading" className="flex flex-col gap-6">
      <Link to="/producer" className="inline-flex items-center gap-1 text-sm text-dim no-underline hover:text-ink">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to dashboard
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 id="producer-products-heading">Products</h1>
          <p className="measure text-dim">
            Manage what you sell. Buyers see these prices and stock in the catalog.
          </p>
        </div>
        {!formOpen && (
          <Button onClick={openCreate}>
            <Plus size={16} aria-hidden="true" />
            Add product
          </Button>
        )}
      </header>

      {formOpen && (
        <section aria-labelledby="product-form-heading" className="rule pt-6">
          <div className="mb-6 flex flex-col gap-1">
            <h2 id="product-form-heading">
              {editing ? 'Edit product' : 'Add product'}
            </h2>
            <p className="text-sm text-dim">
              {editing
                ? 'Change details, price, stock or photo. Buyers see the update in the catalog.'
                : 'Add something you grow or make. It appears in the catalog as soon as you save.'}
            </p>
          </div>
          <ProductForm
            key={editing?.id ?? 'new'}
            product={editing}
            onSave={handleSave}
            onCancel={closeForm}
          />
        </section>
      )}

      <PageState
        loading={loading}
        error={error}
        errorMessage={error ?? undefined}
        onRetry={reload}
        empty={empty}
        emptyMessage="You have no products yet. Add your first product so buyers can find it in the catalog."
      >
        {products.length > 0 && (
          <ProductTable
            products={products}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        )}
      </PageState>
    </section>
  )
}
