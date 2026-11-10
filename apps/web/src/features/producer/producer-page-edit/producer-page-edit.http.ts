import { api } from '@/services/api'
import type {
  ProducerPageDto,
  SaveProducerPageRequestDto,
} from './producer-page-edit.dto'
import type { ProducerPageEditService } from './producer-page-edit.service'
import type { ProducerPageInput } from './producer-page-edit.types'

function toBody(input: ProducerPageInput): SaveProducerPageRequestDto {
  return {
    bio: input.bio,
    location: input.location,
    lat: input.lat,
    lng: input.lng,
    photoUrl: input.photoUrl,
  }
}

export const producerPageEditHttpService: ProducerPageEditService = {
  async getMine(): Promise<ProducerPageDto> {
    return api<ProducerPageDto>('/producers/me')
  },

  async saveMine(input: ProducerPageInput): Promise<ProducerPageDto> {
    return api<ProducerPageDto>('/producers/me', {
      method: 'PUT',
      body: JSON.stringify(toBody(input)),
    })
  },
}
