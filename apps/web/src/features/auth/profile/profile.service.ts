import { USE_MOCKS } from '@/services/env'
import { profileHttpService } from './profile.http'
import { profileMockService } from './profile.mock'
import type { CardInput, Profile, ProfileDetailsInput, ProfileSeed } from './profile.types'

export interface ProfileService {
  getProfile(seed: ProfileSeed): Promise<Profile>
  updateProfile(seed: ProfileSeed, input: ProfileDetailsInput): Promise<Profile>
  updateCard(seed: ProfileSeed, input: CardInput): Promise<Profile>
}

export const profileService: ProfileService = USE_MOCKS ? profileMockService : profileHttpService
