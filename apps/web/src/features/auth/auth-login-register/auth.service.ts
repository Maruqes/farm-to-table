import { USE_MOCKS } from '@/services/env'
import type { AuthSession, LoginInput, RegisterInput } from '@/types/auth'
import { authHttpService } from './auth.http'
import { authMockService } from './auth.mock'

export interface AuthService {
  login(input: LoginInput): Promise<AuthSession>
  register(input: RegisterInput): Promise<AuthSession>
}

export const authService: AuthService = USE_MOCKS ? authMockService : authHttpService
