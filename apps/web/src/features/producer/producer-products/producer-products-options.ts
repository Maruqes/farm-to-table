import {
  CATEGORY_OPTIONS,
  SEASON_OPTIONS,
  type SelectOption,
} from '@/features/catalog/home-catalog/catalog-options'

export { CATEGORY_OPTIONS, SEASON_OPTIONS }

// Units already used by the catalog, so the manager and the shop speak the same language.
export const UNIT_OPTIONS: SelectOption<string>[] = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'bunch', label: 'Bunch' },
  { value: 'jar', label: 'Jar' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'wheel', label: 'Wheel' },
  { value: 'loaf', label: 'Loaf' },
]

export function seasonLabel(value: string): string {
  return SEASON_OPTIONS.find((option) => option.value === value)?.label ?? 'All year'
}

export function isCategoryValue(value: string): boolean {
  return CATEGORY_OPTIONS.some((option) => option.value === value)
}

export function isUnitValue(value: string): boolean {
  return UNIT_OPTIONS.some((option) => option.value === value)
}

export function isSeasonValue(value: string): boolean {
  return SEASON_OPTIONS.some((option) => option.value === value)
}
