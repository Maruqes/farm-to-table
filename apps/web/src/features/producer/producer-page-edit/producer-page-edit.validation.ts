import type {
  ProducerPageFieldErrors,
  ProducerPageFormValues,
  ProducerPageInput,
} from './producer-page-edit.types'

export const MAX_BIO_LENGTH = 600
const FIELD_ORDER = ['bio', 'location', 'lat', 'lng', 'photoUrl'] as const

function parseCoordinate(value: string): number | null | undefined {
  const trimmed = value.trim()
  if (!trimmed) return null
  const number = Number(trimmed)
  return Number.isFinite(number) ? number : undefined
}

export function roundCoordinate(value: number): number {
  return Math.round(value * 100000) / 100000
}

export function toProducerPageInput(
  values: ProducerPageFormValues,
): ProducerPageInput {
  const lat = parseCoordinate(values.lat)
  const lng = parseCoordinate(values.lng)

  return {
    bio: values.bio.trim(),
    location: values.location.trim(),
    lat:
      typeof lat === 'number' && lat >= -90 && lat <= 90
        ? roundCoordinate(lat)
        : null,
    lng:
      typeof lng === 'number' && lng >= -180 && lng <= 180
        ? roundCoordinate(lng)
        : null,
    photoUrl: values.photoUrl.trim(),
  }
}

export function isWebPhotoUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function coordinateErrors(
  lat: number | null | undefined,
  lng: number | null | undefined,
): ProducerPageFieldErrors {
  const errors: ProducerPageFieldErrors = {}

  if (lat === undefined) {
    errors.lat = 'Enter latitude as a number, or leave it empty.'
  }
  if (lng === undefined) {
    errors.lng = 'Enter longitude as a number, or leave it empty.'
  }

  const bothParsed = lat !== undefined && lng !== undefined
  if (bothParsed) {
    const latMissing = lat === null
    const lngMissing = lng === null
    if (latMissing !== lngMissing) {
      if (!errors.lat) {
        errors.lat = 'Add a latitude too, or leave both coordinates empty.'
      }
      if (!errors.lng) {
        errors.lng = 'Add a longitude too, or leave both coordinates empty.'
      }
    }
  }

  if (typeof lat === 'number' && (lat < -90 || lat > 90)) {
    errors.lat = 'Latitude must be between -90 and 90.'
  }
  if (typeof lng === 'number' && (lng < -180 || lng > 180)) {
    errors.lng = 'Longitude must be between -180 and 180.'
  }

  return errors
}

function photoErrors(photoUrl: string): ProducerPageFieldErrors {
  if (photoUrl && !isWebPhotoUrl(photoUrl)) {
    return { photoUrl: 'Enter a full image URL starting with http:// or https://.' }
  }
  return {}
}

export function validateProducerPageInput(
  input: ProducerPageInput,
): ProducerPageFieldErrors {
  const errors: ProducerPageFieldErrors = {}

  if (input.bio.length > MAX_BIO_LENGTH) {
    errors.bio = `Keep the bio to ${MAX_BIO_LENGTH} characters or fewer.`
  }
  if (!input.location) {
    errors.location = 'Locality is required.'
  }

  return {
    ...errors,
    ...coordinateErrors(input.lat, input.lng),
    ...photoErrors(input.photoUrl),
  }
}

export function validateProducerPageForm(
  values: ProducerPageFormValues,
): ProducerPageFieldErrors {
  const errors: ProducerPageFieldErrors = {}
  const bio = values.bio.trim()
  const location = values.location.trim()
  const photoUrl = values.photoUrl.trim()

  if (bio.length > MAX_BIO_LENGTH) {
    errors.bio = `Keep the bio to ${MAX_BIO_LENGTH} characters or fewer.`
  }
  if (!location) {
    errors.location = 'Locality is required.'
  }

  return {
    ...errors,
    ...coordinateErrors(parseCoordinate(values.lat), parseCoordinate(values.lng)),
    ...photoErrors(photoUrl),
  }
}

export function pickFieldErrors(
  fields: Record<string, string> | undefined,
): ProducerPageFieldErrors {
  const errors: ProducerPageFieldErrors = {}
  if (!fields) return errors
  for (const field of FIELD_ORDER) {
    const message = fields[field]
    if (message) errors[field] = message
  }
  return errors
}

export function focusFirstError(errors: ProducerPageFieldErrors): void {
  requestAnimationFrame(() => {
    for (const field of FIELD_ORDER) {
      if (!errors[field]) continue
      document.getElementById(field)?.focus()
      return
    }
  })
}
