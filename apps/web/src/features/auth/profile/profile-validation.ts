import type { FieldErrors } from '../auth-login-register/validation'
import { emailError, requiredError } from '../auth-login-register/validation'
import type { CardInput, ProfileDetailsInput } from './profile.types'

export function cardDigits(value: string): string {
  return value.replace(/[\s-]/g, '')
}

export function luhnValid(digits: string): boolean {
  let sum = 0
  for (let i = 0; i < digits.length; i += 1) {
    let n = Number(digits[digits.length - 1 - i])
    if (i % 2 === 1) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
  }
  return sum % 10 === 0
}

export function cardNumberError(value: string): string | undefined {
  const digits = cardDigits(value)
  if (!digits) return 'Card number is required.'
  if (!/^\d{16}$/.test(digits)) return 'Enter 16 digits, in groups of 4.'
  if (!luhnValid(digits)) return 'This card number is not valid. Check the digits.'
  return undefined
}

export function expiryError(value: string, now = new Date()): string | undefined {
  const match = /^(\d{2})\/(\d{2})$/.exec(value.trim())
  if (!match) return 'Use the format MM/YY.'
  const month = Number(match[1])
  const year = 2000 + Number(match[2])
  if (month < 1 || month > 12) return 'Month must be between 01 and 12.'
  if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
    return 'This card has expired.'
  }
  return undefined
}

export function validateDetails(values: ProfileDetailsInput): FieldErrors {
  const errors: FieldErrors = {}
  const name = requiredError(values.name, 'Name')
  if (name) errors.name = name
  const email = emailError(values.email)
  if (email) errors.email = email
  return errors
}

export function validateCard(values: CardInput): FieldErrors {
  const errors: FieldErrors = {}
  const number = cardNumberError(values.number)
  if (number) errors.number = number
  const holder = requiredError(values.holder, 'Card holder')
  if (holder) errors.holder = holder
  const expiry = expiryError(values.expiry)
  if (expiry) errors.expiry = expiry
  return errors
}
