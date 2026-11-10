import type { CatalogSort } from './catalog.types'

export interface SelectOption<T extends string> {
  value: T
  label: string
}

export const CATEGORY_OPTIONS: SelectOption<string>[] = [
  { value: 'vegetables', label: 'Vegetables' },
  { value: 'fruit', label: 'Fruit' },
  { value: 'honey', label: 'Honey' },
  { value: 'wine', label: 'Wine' },
  { value: 'cheese', label: 'Cheese' },
  { value: 'bakery', label: 'Bakery' },
]

export const SEASON_OPTIONS: SelectOption<string>[] = [
  { value: 'spring', label: 'Spring' },
  { value: 'summer', label: 'Summer' },
  { value: 'autumn', label: 'Autumn' },
  { value: 'winter', label: 'Winter' },
  { value: 'all-year', label: 'All year' },
]

export const SORT_OPTIONS: SelectOption<CatalogSort>[] = [
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating-desc', label: 'Highest rated' },
]

export function categoryLabel(value: string): string {
  return CATEGORY_OPTIONS.find((option) => option.value === value)?.label ?? 'Local produce'
}

export function isCatalogSort(value: string | null): value is CatalogSort {
  return SORT_OPTIONS.some((option) => option.value === value)
}

export function isCategory(value: string | null): value is string {
  return CATEGORY_OPTIONS.some((option) => option.value === value)
}

export function isSeason(value: string | null): value is string {
  return SEASON_OPTIONS.some((option) => option.value === value)
}
