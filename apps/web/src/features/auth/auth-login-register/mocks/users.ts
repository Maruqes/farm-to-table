import type { UserDto } from '../auth.dto'

// Mock-only record: the password never leaves the mock, and DTOs are produced from it.
export interface MockUserRecord extends UserDto {
  id: string
  name: string
  email: string
  role: 'buyer' | 'producer' | 'admin'
  password: string
  farmName?: string
  locality?: string
}

export const MOCK_PASSWORD = 'password123'

export const MOCK_USERS: MockUserRecord[] = [
  {
    id: 'user-buyer-ana',
    name: 'Ana Silva',
    email: 'ana@example.com',
    role: 'buyer',
    password: MOCK_PASSWORD,
  },
  {
    id: 'user-producer-quinta',
    name: 'Quinta do Vale',
    email: 'quinta@example.com',
    role: 'producer',
    producerStatus: 'approved',
    password: MOCK_PASSWORD,
    farmName: 'Quinta do Vale',
    locality: 'Douro, Portugal',
  },
  {
    id: 'user-producer-horta',
    name: 'Horta da Ribeira',
    email: 'horta@example.com',
    role: 'producer',
    producerStatus: 'pending',
    password: MOCK_PASSWORD,
    farmName: 'Horta da Ribeira',
    locality: 'Minho, Portugal',
  },
  {
    id: 'user-admin',
    name: 'Administrator',
    email: 'admin@example.com',
    role: 'admin',
    password: MOCK_PASSWORD,
  },
]
