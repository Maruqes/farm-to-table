export type FieldErrors = Record<string, string>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function requiredError(value: string, label: string): string | undefined {
  return value.trim() ? undefined : `${label} is required.`
}

export function emailError(value: string): string | undefined {
  const email = value.trim()
  if (!email) return 'Email is required.'
  if (!EMAIL_PATTERN.test(email)) return 'Enter a valid email address.'
  return undefined
}

export function passwordError(value: string): string | undefined {
  if (!value) return 'Password is required.'
  if (value.length < 8) return 'Password must be at least 8 characters.'
  return undefined
}

export function pickFieldErrors(
  fields: Record<string, string> | undefined,
  allowed: readonly string[],
): FieldErrors {
  const errors: FieldErrors = {}
  if (!fields) return errors
  for (const field of allowed) {
    const message = fields[field]
    if (message) errors[field] = message
  }
  return errors
}

export function focusFirstError(errors: FieldErrors): void {
  requestAnimationFrame(() => {
    for (const field of Object.keys(errors)) {
      const element = document.getElementById(field)
      if (element) {
        element.focus()
        return
      }
    }
  })
}
