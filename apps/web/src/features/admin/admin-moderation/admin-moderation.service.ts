import { USE_MOCKS } from '@/services/env'
import type { AdminContentItemDto } from './admin-moderation.dto'
import { adminModerationHttpService } from './admin-moderation.http'
import { adminModerationMockService } from './admin-moderation.mock'
import type { ContentType } from './admin-moderation.types'

export interface AdminModerationService {
  list(type: ContentType): Promise<AdminContentItemDto[]>
  setHidden(
    type: ContentType,
    id: string,
    hidden: boolean,
  ): Promise<AdminContentItemDto>
}

export const adminModerationService: AdminModerationService = USE_MOCKS
  ? adminModerationMockService
  : adminModerationHttpService
