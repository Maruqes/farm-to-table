import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { useSession } from '@/context/session'
import { ApiError, authService } from '@/features/auth/auth-login-register'
import { FormAlert, TextField } from './form-fields'
import { emailError, focusFirstError, passwordError, pickFieldErrors, type FieldErrors } from './validation'

interface LoginValues {
  email: string
  password: string
}

const EMPTY_VALUES: LoginValues = { email: '', password: '' }

function validate(values: LoginValues): FieldErrors {
  const errors: FieldErrors = {}
  const email = emailError(values.email)
  if (email) errors.email = email
  const password = passwordError(values.password)
  if (password) errors.password = password
  return errors
}

export function LoginForm() {
  const { signIn } = useSession()
  const [values, setValues] = useState<LoginValues>(EMPTY_VALUES)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function update(field: keyof LoginValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
    setFormError(null)
  }

  function handleBlur(field: keyof LoginValues) {
    const message = field === 'email' ? emailError(values.email) : passwordError(values.password)
    setErrors((current) => {
      const next = { ...current }
      if (message) next[field] = message
      else delete next[field]
      return next
    })
  }

  function handleError(error: unknown) {
    if (!(error instanceof ApiError)) {
      setFormError('Something went wrong. Try again.')
      return
    }
    if (error.status === 401 || error.code === 'INVALID_CREDENTIALS') {
      setFormError('Email or password is incorrect. Check your details and try again.')
      return
    }
    const fieldErrors = pickFieldErrors(error.fields, ['email', 'password'])
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      focusFirstError(fieldErrors)
      return
    }
    setFormError(error.message)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    setFormError(null)
    const nextErrors = validate(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      focusFirstError(nextErrors)
      return
    }

    setSubmitting(true)
    try {
      const session = await authService.login({
        email: values.email.trim(),
        password: values.password,
      })
      signIn(session.user, session.token)
    } catch (error) {
      handleError(error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-busy={submitting} className="space-y-4">
      {formError && <FormAlert>{formError}</FormAlert>}

      <TextField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        value={values.email}
        onChange={(event) => update('email', event.target.value)}
        onBlur={() => handleBlur('email')}
        error={errors.email}
        required
      />

      <TextField
        id="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        value={values.password}
        onChange={(event) => update('password', event.target.value)}
        onBlur={() => handleBlur('password')}
        error={errors.password}
        required
      />

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}
