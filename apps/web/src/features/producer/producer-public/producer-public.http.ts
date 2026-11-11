import { api } from '@/services/api'
import { adaptProducerPublic } from './producer-public.adapter'
import type { ProducerPublicDto } from './producer-public.dto'
import type { ProducerPublicService } from './producer-public.service'
import type { ProducerPublic } from './producer-public.types'

export const producerPublicHttpService: ProducerPublicService = {
  async getProducer(id: string): Promise<ProducerPublic> {
    const dto = await api<ProducerPublicDto>(
      `/producers/${encodeURIComponent(id)}`,
    )
    return adaptProducerPublic(dto)
  },
}
