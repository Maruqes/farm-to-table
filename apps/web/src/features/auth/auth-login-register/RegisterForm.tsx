import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { useSession } from '@/context/session'
import { ApiError, authService } from '@/features/auth/auth-login-register'
import { FormAlert, TextField } from './form-fields'
import {
  emailError,
  focusFirstError,
  passwordError,
  pickFieldErrors,
  requiredError,
  type FieldErrors,
} from './validation'

type AccountRole = 'buyer' | 'producer'

type TextFieldName = 'name' | 'email' | 'password' | 'farmName' | 'locality'

interface RegisterValues {
  name: string
  email: string
  password: string
  farmName: string
  locality: string
}

const EMPTY_VALUES: RegisterValues = { name: '', email: '', password: '', farmName: '', locality: '' }

const ROLE_OPTIONS: { value: AccountRole; label: string; description: string }[] = [
  { value: 'buyer', label: 'Buyer', description: 'Shop from local farms.' },
  { value: 'producer', label: 'Producer', description: 'Sell your produce and run auctions.' },
]

const BASE_FIELDS: TextFieldName[] = ['name', 'email', 'password']
const SERVER_FIELDS = ['name', 'email', 'password', 'role', 'farmName', 'locality'] as const

function fieldError(values: RegisterValues, field: TextFieldName): string | undefined {
  switch (field) {
    case 'name':
      return requiredError(values.name, 'Name')
    case 'email':
      return emailError(values.email)
    case 'password':
      return passwordError(values.password)
    case 'farmName':
      return requiredError(values.farmName, 'Farm name')
    case 'locality':
      return requiredError(values.locality, 'Locality')
  }
}

function validate(values: RegisterValues, role: AccountRole): FieldErrors {
  const errors: FieldErrors = {}
  const fields = role === 'producer' ? [...BASE_FIELDS, 'farmName' as const, 'locality' as const] : BASE_FIELDS
  for (const field of fields) {
    const message = fieldError(values, field)
    if (message) errors[field] = message
  }
  return errors
}

export function RegisterForm() {
  const { signIn } = useSession()
  const [role, setRole] = useState<AccountRole>('buyer')
  const [values, setValues] = useState<RegisterValues>(EMPTY_VALUES)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function update(field: TextFieldName, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
    setFormError(null)
  }

  function handleBlur(field: TextFieldName) {
    const message = fieldError(values, field)
    setErrors((current) => {
      const next = { ...current }
      if (message) next[field] = message
      else delete next[field]
      return next
    })
  }

  function handleRoleChange(nextRole: AccountRole) {
    setRole(nextRole)
    setFormError(null)
    setErrors((current) => {
      const next = { ...current }
      delete next.role
      if (nextRole === 'buyer') {
        delete next.farmName
        delete next.locality
      }
      return next
    })
  }

  function handleError(error: unknown) {
    if (!(error instanceof ApiError)) {
      setFormError('Something went wrong. Try again.')
      return
    }
    const allowed = role === 'producer' ? SERVER_FIELDS : ['name', 'email', 'password', 'role']
    const fieldErrors = pickFieldErrors(error.fields, allowed)
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
    const nextErrors = validate(values, role)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      focusFirstError(nextErrors)
      return
    }

    setSubmitting(true)
    try {
      const session = await authService.register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        role,
        ...(role === 'producer'
          ? { farmName: values.farmName.trim(), locality: values.locality.trim() }
          : {}),
      })
      signIn(session.user, session.token)
    } catch (error) {
      handleError(error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-busy={submitting} className="flex flex-col gap-4">
      {formError && <FormAlert>{formError}</FormAlert>}

      <TextField
        id="name"
        label="Name"
        autoComplete="name"
        value={values.name}
        onChange={(event) => update('name', event.target.value)}
        onBlur={() => handleBlur('name')}
        error={errors.name}
        required
      />

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
        autoComplete="new-password"
        hint="At least 8 characters."
        value={values.password}
        onChange={(event) => update('password', event.target.value)}
        onBlur={() => handleBlur('password')}
        error={errors.password}
        required
      />

      <fieldset
        className="flex flex-col gap-2"
        aria-invalid={errors.role ? true : undefined}
        aria-describedby={errors.role ? 'role-error' : undefined}
      >
        <legend className="label-line mb-0">Account type</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {ROLE_OPTIONS.map((option) => {
            const selected = role === option.value
            return (
              <div key={option.value}>
                <label className={selected ? 'flex h-full cursor-pointer items-start gap-2.5 border-2 border-ink bg-ink px-3 py-2.5 text-paper focus-within:outline-2 focus-within:outline-solid focus-within:outline-ink focus-within:outline-offset-2' : 'flex h-full cursor-pointer items-start gap-2.5 border-2 border-ink px-3 py-2.5 focus-within:outline-2 focus-within:outline-solid focus-within:outline-ink focus-within:outline-offset-2'}>
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={selected}
                    onChange={() => handleRoleChange(option.value)}
                    className="sr-only"
                  />
                  <span>
                    <span className="block text-sm font-semibold">{option.label}</span>
                    <span className={selected ? 'block text-sm text-paper' : 'block text-sm text-dim'}>
                      {option.description}
                    </span>
                  </span>
                </label>
              </div>
            )
          })}
        </div>
        {errors.role && (
          <p id="role-error" className="mb-0 text-sm text-alarm">
            {errors.role}
          </p>
        )}
      </fieldset>

      {role === 'producer' && (
        <div className="flex flex-col gap-4">
          <p className="label-line">Farm details</p>
          <TextField
            id="farmName"
            label="Farm name"
            autoComplete="organization"
            value={values.farmName}
            onChange={(event) => update('farmName', event.target.value)}
            onBlur={() => handleBlur('farmName')}
            error={errors.farmName}
            required
          />
          <TextField
            id="locality"
            label="Locality"
            autoComplete="address-level2"
            value={values.locality}
            onChange={(event) => update('locality', event.target.value)}
            onBlur={() => handleBlur('locality')}
            error={errors.locality}
            required
          />
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  )
}
