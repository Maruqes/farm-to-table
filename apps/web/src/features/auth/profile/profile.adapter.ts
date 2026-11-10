import type { CardDto, ProfileDto } from './profile.dto'
import type { CardSummary, Profile } from './profile.types'

function adaptCard(dto: CardDto | null | undefined): CardSummary | null {
  const last4 = dto?.last4?.trim()
  if (!last4) return null
  return {
    last4,
    holder: dto?.holder?.trim() ?? '',
    expiry: dto?.expiry?.trim() ?? '',
    simulateInvalid: dto?.simulateInvalid === true,
  }
}

export function adaptProfile(dto: ProfileDto | null | undefined): Profile {
  return {
    id: dto?.id || dto?._id || '',
    name: dto?.name?.trim() ?? '',
    email: dto?.email?.trim() ?? '',
    address: dto?.address?.trim() ?? '',
    card: adaptCard(dto?.card),
  }
}
