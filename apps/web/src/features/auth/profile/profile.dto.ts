// API shapes assumed by FE-10. Every field may be missing or renamed later.
export interface CardDto {
  last4?: string
  holder?: string
  expiry?: string
  simulateInvalid?: boolean
}

export interface ProfileDto {
  id?: string
  _id?: string
  name?: string
  email?: string
  address?: string
  card?: CardDto | null
}

export interface UpdateProfileRequestDto {
  name: string
  email: string
  address: string
}

export interface UpdateCardRequestDto {
  number: string
  holder: string
  expiry: string
  simulateInvalid: boolean
}
