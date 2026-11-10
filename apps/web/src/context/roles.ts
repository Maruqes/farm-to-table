import type { AuthenticatedRole, Role, SessionUser } from './session'

export const AUTHENTICATED_ROLES: AuthenticatedRole[] = ['buyer', 'producer', 'admin']

export const ROLE_LABELS: Record<Role, string> = {
  visitor: 'Visitor',
  buyer: 'Buyer',
  producer: 'Producer',
  admin: 'Admin',
}

// Mock identities used until authentication lands (FE-01).
export const MOCK_USERS: Record<AuthenticatedRole, SessionUser> = {
  buyer: { id: 'user-buyer-1', name: 'Ana Silva', email: 'ana@example.com', role: 'buyer' },
  producer: {
    id: 'user-producer-1',
    name: 'Quinta do Vale',
    email: 'quinta@example.com',
    role: 'producer',
    producerStatus: 'approved',
  },
  admin: { id: 'user-admin-1', name: 'Administrator', email: 'admin@example.com', role: 'admin' },
}
