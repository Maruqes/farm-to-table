import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/services/api'
import { FormAlert, TextField } from '../auth-login-register/form-fields'
import { focusFirstError, pickFieldErrors, type FieldErrors } from '../auth-login-register/validation'
import { validateDetails } from './profile-validation'
import { profileService } from './profile.service'
import type { Profile, ProfileDetailsInput, ProfileSeed } from './profile.types'

interface Props {
  profile: Profile
  seed: ProfileSeed
  onSaved: (profile: Profile) => void
}

export function DetailsForm({ profile, seed, onSaved }: Props) {
  const [values, setValues] = useState<ProfileDetailsInput>({
    name: profile.name,
    email: profile.email,
    address: profile.address,
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function update(field: keyof ProfileDetailsInput, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
    setFormError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    const nextErrors = validateDetails(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      focusFirstError(nextErrors)
      return
    }
    setSaving(true)
    try {
      const saved = await profileService.updateProfile(seed, values)
      onSaved(saved)
      toast.success('Your details were saved.')
    } catch (error) {
      if (error instanceof ApiError) {
        const fieldErrors = pickFieldErrors(error.fields, ['name', 'email', 'address'])
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors)
          focusFirstError(fieldErrors)
        } else setFormError(error.message)
      } else setFormError('Something went wrong. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-busy={saving} className="vstack gap-3">
      {formError && <FormAlert>{formError}</FormAlert>}
      <TextField
        id="name"
        label="Name"
        autoComplete="name"
        value={values.name}
        onChange={(event) => update('name', event.target.value)}
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
        error={errors.email}
        required
      />
      <TextField
        id="address"
        label="Address"
        autoComplete="street-address"
        hint="Street, postal code and city. Used for deliveries."
        value={values.address}
        onChange={(event) => update('address', event.target.value)}
        error={errors.address}
      />
      <Button type="submit" disabled={saving}>
        {saving ? 'Saving…' : 'Save details'}
      </Button>
    </form>
  )
}
