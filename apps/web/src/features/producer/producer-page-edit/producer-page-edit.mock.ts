import { ApiError } from '@/services/api'
import type { ProducerPageDto } from './producer-page-edit.dto'
import type { ProducerPageEditService } from './producer-page-edit.service'
import type { ProducerPageInput } from './producer-page-edit.types'
import { validateProducerPageInput } from './producer-page-edit.validation'
import { createMockProducerPage } from './mocks/page'

const MOCK_LATENCY_MS = 450

// Set `ftt.producer-page-edit.mock-error` to `1` to exercise the load error and retry states.
export const MOCK_PAGE_ERROR_KEY = 'ftt.producer-page-edit.mock-error'
// Set `ftt.producer-page-edit.mock-empty` to `1` to load a blank page for a new producer.
export const MOCK_PAGE_EMPTY_KEY = 'ftt.producer-page-edit.mock-empty'

let store: ProducerPageDto | null = null

function getStore(): ProducerPageDto {
  const current = store ?? createMockProducerPage()
  store = current
  return current
}

function wait(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, MOCK_LATENCY_MS)
  })
}

function isFlagOn(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function clone(dto: ProducerPageDto): ProducerPageDto {
  return { ...dto }
}

function applyInput(dto: ProducerPageDto, input: ProducerPageInput): void {
  dto.bio = input.bio
  dto.location = input.location
  dto.photoUrl = input.photoUrl

  if (input.lat === null) delete dto.lat
  else dto.lat = input.lat

  if (input.lng === null) delete dto.lng
  else dto.lng = input.lng
}

export const producerPageEditMockService: ProducerPageEditService = {
  async getMine(): Promise<ProducerPageDto> {
    await wait()

    if (isFlagOn(MOCK_PAGE_ERROR_KEY)) {
      throw new ApiError(
        500,
        'INTERNAL_ERROR',
        'Your public page could not be loaded. Please try again.',
      )
    }

    if (isFlagOn(MOCK_PAGE_EMPTY_KEY)) {
      const current = getStore()
      return { id: current.id, name: current.name }
    }

    return clone(getStore())
  },

  async saveMine(input: ProducerPageInput): Promise<ProducerPageDto> {
    await wait()

    const fields = validateProducerPageInput(input)
    if (Object.keys(fields).length > 0) {
      throw new ApiError(
        400,
        'VALIDATION_ERROR',
        'Some fields are invalid.',
        fields,
      )
    }

    const dto = getStore()
    applyInput(dto, input)
    return clone(dto)
  },
}
