import { api } from '@/services/api'
import { adaptProfile } from './profile.adapter'
import type { ProfileDto, UpdateCardRequestDto, UpdateProfileRequestDto } from './profile.dto'
import type { ProfileService } from './profile.service'

export const profileHttpService: ProfileService = {
  async getProfile() {
    return adaptProfile(await api<ProfileDto>('/users/me'))
  },

  async updateProfile(_seed, input) {
    const body: UpdateProfileRequestDto = {
      name: input.name,
      email: input.email,
      address: input.address,
    }
    return adaptProfile(
      await api<ProfileDto>('/users/me', { method: 'PUT', body: JSON.stringify(body) }),
    )
  },

  async updateCard(_seed, input) {
    const body: UpdateCardRequestDto = {
      number: input.number,
      holder: input.holder,
      expiry: input.expiry,
      simulateInvalid: input.simulateInvalid,
    }
    return adaptProfile(
      await api<ProfileDto>('/users/me/card', { method: 'PUT', body: JSON.stringify(body) }),
    )
  },
}
