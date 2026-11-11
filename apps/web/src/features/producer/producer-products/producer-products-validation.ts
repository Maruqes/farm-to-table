import type { ProductFieldErrors, ProductFormValues } from './producer-products.types'
import {
  isCategoryValue,
  isSeasonValue,
  isUnitValue,
} from './producer-products-options'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const FIELD_ORDER = [
  'name',
  'category',
  'price',
  'unit',
  'stock',
  'season',
  'image',
] as const

export function imageError(file: File): string | undefined {
  if (!file.type.startsWith('image/')) return 'Choose an image file (JPG, PNG or WebP).'
  if (file.size > MAX_IMAGE_BYTES) return 'The image must be 5 MB or smaller.'
  return undefined
}

export function validateProduct(
  values: ProductFormValues,
  image: File | null,
): ProductFieldErrors {
  const errors: ProductFieldErrors = {}
  const name = values.name.trim()

  if (!name) errors.name = 'Product name is required.'
  else if (name.length < 2) errors.name = 'Use at least 2 characters.'
  else if (name.length > 80) errors.name = 'Use 80 characters or fewer.'

  if (!isCategoryValue(values.category)) errors.category = 'Choose a category.'

  const price = Number(values.price)
  if (!values.price.trim()) errors.price = 'Price is required.'
  else if (!Number.isFinite(price)) errors.price = 'Enter a price as a number.'
  else if (price <= 0) errors.price = 'Price must be more than 0.'
  else if (price > 100000) errors.price = 'Price must be 100,000 or less.'

  if (!isUnitValue(values.unit)) errors.unit = 'Choose a unit.'

  const stock = Number(values.stock)
  if (!values.stock.trim()) errors.stock = 'Stock is required.'
  else if (!Number.isFinite(stock)) errors.stock = 'Enter stock as a number.'
  else if (!Number.isInteger(stock)) errors.stock = 'Use a whole number.'
  else if (stock < 0) errors.stock = 'Stock cannot be negative.'
  else if (stock > 1000000) errors.stock = 'Stock must be 1,000,000 or less.'

  if (!isSeasonValue(values.season)) errors.season = 'Choose a season.'

  if (image) {
    const problem = imageError(image)
    if (problem) errors.image = problem
  }

  return errors
}

export function pickFieldErrors(
  fields: Record<string, string> | undefined,
): ProductFieldErrors {
  const errors: ProductFieldErrors = {}
  if (!fields) return errors
  for (const field of FIELD_ORDER) {
    const message = fields[field]
    if (message) errors[field] = message
  }
  return errors
}

export function focusFirstError(errors: ProductFieldErrors): void {
  requestAnimationFrame(() => {
    for (const field of FIELD_ORDER) {
      if (!errors[field]) continue
      document.getElementById(field)?.focus()
      return
    }
  })
}
