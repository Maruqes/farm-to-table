import { api } from '@/services/api'
import { adaptProducersDirectory } from './producers-directory.adapter'
import type { ProducerDirectoryItemDto } from './producers-directory.dto'
import type { ProducersDirectoryService } from './producers-directory.service'
import type {
  ProducerDirectoryItem,
  ProducersDirectoryQuery,
} from './producers-directory.types'

export const producersDirectoryHttpService: ProducersDirectoryService = {
  async listProducers(
    query: ProducersDirectoryQuery = {},
  ): Promise<ProducerDirectoryItem[]> {
    const params = new URLSearchParams()
    if (query.q) params.set('q', query.q)
    if (query.location) params.set('location', query.location)
    const search = params.toString()

    const dto = await api<ProducerDirectoryItemDto[]>(
      `/producers${search ? `?${search}` : ''}`,
    )
    return adaptProducersDirectory(dto)
  },
}
