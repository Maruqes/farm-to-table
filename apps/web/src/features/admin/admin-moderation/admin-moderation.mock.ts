import { ApiError } from '@/services/api'
import type { AdminContentItemDto } from './admin-moderation.dto'
import type { AdminModerationService } from './admin-moderation.service'
import type { ContentType } from './admin-moderation.types'
import { listMockContent, setMockContentHidden } from './mocks/store'

const MOCK_LATENCY_MS = 500
const MOCK_ACTION_LATENCY_MS = 600

// Set `ftt.admin-moderation.mock-error` to `1` to exercise the load error and retry states.
export const MOCK_ADMIN_MODERATION_ERROR_KEY = 'ftt.admin-moderation.mock-error'
// Set `ftt.admin-moderation.mock-empty` to `1` to exercise the empty state.
export const MOCK_ADMIN_MODERATION_EMPTY_KEY = 'ftt.admin-moderation.mock-empty'
// Set `ftt.admin-moderation.mock-action-error` to `1` to exercise a failed hide or unhide.
export const MOCK_ADMIN_MODERATION_ACTION_ERROR_KEY =
  'ftt.admin-moderation.mock-action-error'

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

function isFlagOn(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function notFound(): ApiError {
  return new ApiError(
    404,
    'CONTENT_NOT_FOUND',
    'This item is no longer available. Refresh the list and try again.',
  )
}

export const adminModerationMockService: AdminModerationService = {
  async list(type: ContentType): Promise<AdminContentItemDto[]> {
    await wait(MOCK_LATENCY_MS)

    if (isFlagOn(MOCK_ADMIN_MODERATION_ERROR_KEY)) {
      throw new ApiError(
        500,
        'INTERNAL_ERROR',
        'Content could not be loaded. Please try again.',
      )
    }

    if (isFlagOn(MOCK_ADMIN_MODERATION_EMPTY_KEY)) return []

    return listMockContent(type)
  },

  async setHidden(
    type: ContentType,
    id: string,
    hidden: boolean,
  ): Promise<AdminContentItemDto> {
    await wait(MOCK_ACTION_LATENCY_MS)

    if (isFlagOn(MOCK_ADMIN_MODERATION_ACTION_ERROR_KEY)) {
      throw new ApiError(
        500,
        'INTERNAL_ERROR',
        'The change could not be saved. Please try again.',
      )
    }

    const item = setMockContentHidden(type, id, hidden)
    if (!item) throw notFound()
    return item
  },
}
