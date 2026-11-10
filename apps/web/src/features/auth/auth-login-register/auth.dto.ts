// API shapes assumed by FE-01. Every field may be missing or renamed later.
export interface UserDto {
  id?: string
  _id?: string
  name?: string
  email?: string
  role?: string
  producerStatus?: string
}

export interface LoginRequestDto {
  email: string
  password: string
}

export interface RegisterRequestDto {
  name: string
  email: string
  password: string
  role: 'buyer' | 'producer'
  farmName?: string
  locality?: string
}

export interface AuthResponseDto {
  user?: UserDto
  token?: string
}
