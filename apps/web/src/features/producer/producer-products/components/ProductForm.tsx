import {
  useEffect,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type FormEvent,
  type ReactNode,
} from 'react'
import { AlertTriangle, ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/components/ui/utils'
import { crateClass } from '@/components/crate'
import { CategoryIcon } from '@/features/catalog/home-catalog/components/CategoryIcon'
import { ApiError } from '@/services/api'
import {
  CATEGORY_OPTIONS,
  SEASON_OPTIONS,
  UNIT_OPTIONS,
} from '../producer-products-options'
import {
  focusFirstError,
  imageError,
  pickFieldErrors,
  validateProduct,
} from '../producer-products-validation'
import type {
  ProductFieldErrors,
  ProductFormValues,
  ProductInput,
  ProducerProduct,
} from '../producer-products.types'

function FormAlert({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-2 border-2 border-alarm p-2 px-3 text-sm text-alarm [&>p]:m-0 [&>svg]:mt-0.5 [&>svg]:shrink-0">
      <AlertTriangle size={16} aria-hidden="true" />
      <p>{children}</p>
    </div>
  )
}

interface ProductFormProps {
  product: ProducerProduct | null
  onSave: (input: ProductInput, image: File | null) => Promise<void>
  onCancel: () => void
}

function toFormValues(product: ProducerProduct | null): ProductFormValues {
  return {
    name: product?.name ?? '',
    category: product?.category ?? 'vegetables',
    price: product ? String(product.price) : '',
    unit: product?.unit ?? 'kg',
    stock: product ? String(product.stock) : '',
    season: product?.season ?? 'all-year',
    organic: product?.organic ?? false,
  }
}

function toInput(values: ProductFormValues): ProductInput {
  return {
    name: values.name.trim(),
    category: values.category,
    price: Math.round(Number(values.price) * 100) / 100,
    unit: values.unit,
    stock: Math.trunc(Number(values.stock)),
    season: values.season,
    organic: values.organic,
  }
}

function withoutField(
  errors: ProductFieldErrors,
  field: keyof ProductFieldErrors,
): ProductFieldErrors {
  if (!errors[field]) return errors
  const next = { ...errors }
  delete next[field]
  return next
}

interface FieldMessageProps {
  id: string
  error?: string
  hint?: string
}

function FieldMessage({ id, error, hint }: FieldMessageProps) {
  if (error) {
    return (
      <p id={`${id}-error`} className="text-sm text-alarm">
        {error}
      </p>
    )
  }
  if (hint) {
    return (
      <p id={`${id}-hint`} className="text-sm text-dim">
        {hint}
      </p>
    )
  }
  return null
}

function describedBy(id: string, error?: string, hint?: string): string | undefined {
  if (error) return `${id}-error`
  if (hint) return `${id}-hint`
  return undefined
}

interface TextFieldProps extends Omit<ComponentProps<'input'>, 'id'> {
  id: 'name' | 'price' | 'stock'
  label: string
  error?: string
  hint?: string
}

function TextField({
  id,
  label,
  error,
  hint,
  className,
  ...props
}: TextFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(error && 'is-invalid', className)}
        {...props}
      />
      <FieldMessage id={id} error={error} hint={hint} />
    </div>
  )
}

interface SelectFieldProps extends Omit<ComponentProps<'select'>, 'id'> {
  id: 'category' | 'unit' | 'season'
  label: string
  error?: string
  hint?: string
}

function SelectField({
  id,
  label,
  error,
  hint,
  className,
  children,
  ...props
}: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn('form-select', error && 'is-invalid', className)}
        {...props}
      >
        {children}
      </select>
      <FieldMessage id={id} error={error} hint={hint} />
    </div>
  )
}

export function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>(() => toFormValues(product))
  const [image, setImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState(product?.imageUrl ?? '')
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [errors, setErrors] = useState<ProductFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    document.getElementById('name')?.focus()
  }, [])

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [objectUrl])

  function update<Key extends keyof ProductFormValues>(
    field: Key,
    value: ProductFormValues[Key],
  ) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => withoutField(current, field as keyof ProductFieldErrors))
    setFormError(null)
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    if (objectUrl) URL.revokeObjectURL(objectUrl)

    if (!file) {
      setImage(null)
      setObjectUrl(null)
      setPreviewUrl(product?.imageUrl ?? '')
      setErrors((current) => withoutField(current, 'image'))
      return
    }

    const problem = imageError(file)
    if (problem) {
      setImage(null)
      setObjectUrl(null)
      setPreviewUrl(product?.imageUrl ?? '')
      setErrors((current) => ({ ...current, image: problem }))
      event.target.value = ''
      return
    }

    setImage(file)
    const url = URL.createObjectURL(file)
    setObjectUrl(url)
    setPreviewUrl(url)
    setErrors((current) => withoutField(current, 'image'))
    setFormError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return

    const nextErrors = validateProduct(values, image)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setFormError('Please check the highlighted fields and try again.')
      focusFirstError(nextErrors)
      return
    }

    setSaving(true)
    setFormError(null)
    try {
      await onSave(toInput(values), image)
    } catch (cause) {
      if (cause instanceof ApiError) {
        const fieldErrors = pickFieldErrors(cause.fields)
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors)
          setFormError('Some details need attention. Check the highlighted fields.')
          focusFirstError(fieldErrors)
        } else {
          setFormError(cause.message)
        }
      } else {
        setFormError('The product could not be saved. Check your connection and try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  const imageHint = product?.imageUrl
    ? 'Leave empty to keep the current photo. JPG, PNG or WebP, up to 5 MB.'
    : 'JPG, PNG or WebP, up to 5 MB.'

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-busy={saving}
      className="flex flex-col gap-6"
    >
      {formError && <FormAlert>{formError}</FormAlert>}

      <TextField
        id="name"
        label="Product name"
        value={values.name}
        onChange={(event) => update('name', event.target.value)}
        error={errors.name}
        autoComplete="off"
        maxLength={80}
        required
      />

      <div className="rule grid gap-4 pt-6 md:grid-cols-3">
        <div>
          <SelectField
            id="category"
            label="Category"
            value={values.category}
            onChange={(event) => update('category', event.target.value)}
            error={errors.category}
            required
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
        </div>

        <div>
          <SelectField
            id="unit"
            label="Unit"
            value={values.unit}
            onChange={(event) => update('unit', event.target.value)}
            error={errors.unit}
            required
          >
            {UNIT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
        </div>

        <div>
          <SelectField
            id="season"
            label="Season"
            value={values.season}
            onChange={(event) => update('season', event.target.value)}
            error={errors.season}
            required
          >
            {SEASON_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
        </div>
      </div>

      <div className="rule grid gap-4 pt-6 md:grid-cols-2">
        <div>
          <TextField
            id="price"
            label="Price per unit"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={values.price}
            onChange={(event) => update('price', event.target.value)}
            error={errors.price}
            hint="In euros, for example 3.20."
            required
          />
        </div>

        <div>
          <TextField
            id="stock"
            label="Stock"
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={values.stock}
            onChange={(event) => update('stock', event.target.value)}
            error={errors.stock}
            hint="How many units you have available."
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="organic" className="label-line flex min-h-10 w-fit cursor-pointer items-center gap-2 [&_input]:size-4">
          <input
            id="organic"
            type="checkbox"
            checked={values.organic}
            onChange={(event) => update('organic', event.target.checked)}
            aria-describedby="organic-hint"
            className="form-check-input"
          />
          Organic
        </label>
        <p id="organic-hint" className="text-sm text-dim">
          Adds an organic badge to the product in the catalog.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="image" className="form-label">
          Photo
        </label>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className={cn('frame flex size-24 flex-none items-center justify-center overflow-hidden', crateClass(values.category))}>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={`Photo preview for ${values.name.trim() || 'this product'}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <CategoryIcon category={values.category} className="size-10" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex flex-col gap-2">
            <input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              aria-invalid={errors.image ? true : undefined}
              aria-describedby={describedBy('image', errors.image, imageHint)}
              className={cn('form-control', errors.image && 'is-invalid')}
            />
            <FieldMessage id="image" error={errors.image} hint={imageHint} />
            <p className="flex items-center gap-2 text-xs text-dim">
              <ImagePlus size={14} aria-hidden="true" />
              The photo is cropped to fill the frame.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : product ? 'Save changes' : 'Add product'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
