import { api } from '@/services/api'
import type { AdminContentItemDto } from './admin-moderation.dto'
import type { ContentType } from './admin-moderation.types'
import type { AdminModerationService } from './admin-moderation.service'

export const adminModerationHttpService: AdminModerationService = {
  async list(type: ContentType): Promise<AdminContentItemDto[]> {
    return api<AdminContentItemDto[]>(
      `/admin/content?type=${encodeURIComponent(type)}`,
    )
  },

  async setHidden(
    type: ContentType,
    id: string,
    hidden: boolean,
  ): Promise<AdminContentItemDto> {
    return api<AdminContentItemDto>(
      `/admin/content/${encodeURIComponent(type)}/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ hidden }),
      },
    )
  },
}
