// Domain model consumed by components. API shapes stay in profile.dto.ts.
export interface CardSummary {
  last4: string
  holder: string
  expiry: string
  simulateInvalid: boolean
}

export interface Profile {
  id: string
  name: string
  email: string
  address: string
  card: CardSummary | null
}

export interface ProfileDetailsInput {
  name: string
  email: string
  address: string
}

export interface CardInput {
  number: string
  holder: string
  expiry: string
  simulateInvalid: boolean
}

// Identity the mock seeds from; the HTTP service ignores it.
export interface ProfileSeed {
  id: string
  name: string
  email: string
}
