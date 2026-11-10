import { ApiError } from '@/services/api'
import { adaptProducersDirectory } from './producers-directory.adapter'
import type { ProducersDirectoryService } from './producers-directory.service'
import type {
  ProducerDirectoryItem,
  ProducersDirectoryQuery,
} from './producers-directory.types'
import { listMockProducers } from './mocks/producers'

const MOCK_LATENCY_MS = 400

export const MOCK_PRODUCERS_DIRECTORY_ERROR_KEY = 'ftt.producers-directory.mock-error'
export const MOCK_PRODUCERS_DIRECTORY_EMPTY_KEY = 'ftt.producers-directory.mock-empty'

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

function normalise(value: string): string {
  return value.trim().toLowerCase()
}

export const producersDirectoryMockService: ProducersDirectoryService = {
  async listProducers(
    query: ProducersDirectoryQuery = {},
  ): Promise<ProducerDirectoryItem[]> {
    await wait()

    if (isFlagOn(MOCK_PRODUCERS_DIRECTORY_ERROR_KEY)) {
      throw new ApiError(
        500,
        'INTERNAL_ERROR',
        'The producer directory could not be loaded. Please try again.',
      )
    }

    if (isFlagOn(MOCK_PRODUCERS_DIRECTORY_EMPTY_KEY)) return []

    const needle = normalise(query.q ?? '')
    const location = normalise(query.location ?? '')

    const records = listMockProducers().filter((record) => {
      if (needle && !normalise(record.name ?? '').includes(needle)) return false
      if (location && normalise(record.location ?? '') !== location) return false
      return true
    })

    return adaptProducersDirectory(records)
  },
}
