import { api } from '@/services/api'
import type { AuthSession, LoginInput, RegisterInput } from '@/types/auth'
import { adaptAuthSession } from './auth.adapter'
import type { AuthResponseDto, LoginRequestDto, RegisterRequestDto } from './auth.dto'
import type { AuthService } from './auth.service'

export const authHttpService: AuthService = {
  async login(input: LoginInput): Promise<AuthSession> {
    const body: LoginRequestDto = { email: input.email, password: input.password }
    const dto = await api<AuthResponseDto>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return adaptAuthSession(dto)
  },

  async register(input: RegisterInput): Promise<AuthSession> {
    const body: RegisterRequestDto = {
      name: input.name,
      email: input.email,
      password: input.password,
      role: input.role,
      ...(input.farmName ? { farmName: input.farmName } : {}),
      ...(input.locality ? { locality: input.locality } : {}),
    }
    const dto = await api<AuthResponseDto>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return adaptAuthSession(dto)
  },
}
