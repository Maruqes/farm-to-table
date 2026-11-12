import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/services/api'
import { FormAlert, TextField } from '../auth-login-register/form-fields'
import { focusFirstError, pickFieldErrors, type FieldErrors } from '../auth-login-register/validation'
import { cardNumberError, expiryError, validateCard } from './profile-validation'
import { profileService } from './profile.service'
import type { CardInput, Profile, ProfileSeed } from './profile.types'

interface Props {
  profile: Profile
  seed: ProfileSeed
  onSaved: (profile: Profile) => void
}

// Group digits in 4s as the user types: "4111111111111111" -> "4111 1111 1111 1111".
function groupDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')
}

export function CardForm({ profile, seed, onSaved }: Props) {
  const saved = profile.card
  const [values, setValues] = useState<CardInput>({
    number: '',
    holder: saved?.holder ?? '',
    expiry: saved?.expiry ?? '',
    simulateInvalid: saved?.simulateInvalid ?? false,
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function update<K extends keyof CardInput>(field: K, value: CardInput[K]) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
    setFormError(null)
  }

  function check(field: 'number' | 'expiry') {
    const message = field === 'number' ? cardNumberError(values.number) : expiryError(values.expiry)
    setErrors((current) => {
      const next = { ...current }
      if (message) next[field] = message
      else delete next[field]
      return next
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    const nextErrors = validateCard(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      focusFirstError(nextErrors)
      return
    }
    setSaving(true)
    try {
      const updated = await profileService.updateCard(seed, values)
      onSaved(updated)
      setValues((current) => ({ ...current, number: '' }))
      toast.success('Your card was saved.')
    } catch (error) {
      if (error instanceof ApiError) {
        const fieldErrors = pickFieldErrors(error.fields, ['number', 'holder', 'expiry'])
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
        id="number"
        label="Card number"
        inputMode="numeric"
        autoComplete="off"
        hint={
          saved
            ? `Saved card ends in ${saved.last4}. Enter a new number to replace it.`
            : 'Mock card, no real payment is made.'
        }
        value={values.number}
        onChange={(event) => update('number', groupDigits(event.target.value))}
        onBlur={() => values.number && check('number')}
        error={errors.number}
        className="tabular"
        required
      />
      <TextField
        id="holder"
        label="Card holder"
        autoComplete="off"
        value={values.holder}
        onChange={(event) => update('holder', event.target.value)}
        error={errors.holder}
        required
      />
      <TextField
        id="expiry"
        label="Expiry (MM/YY)"
        inputMode="numeric"
        autoComplete="off"
        maxLength={5}
        value={values.expiry}
        onChange={(event) => update('expiry', event.target.value)}
        onBlur={() => values.expiry && check('expiry')}
        error={errors.expiry}
        className="tabular auth-expiry"
        required
      />
      <div className="d-flex align-items-start gap-2">
        <input
          id="simulateInvalid"
          type="checkbox"
          checked={values.simulateInvalid}
          onChange={(event) => update('simulateInvalid', event.target.checked)}
          className="form-check-input mt-1"
        />
        <label htmlFor="simulateInvalid" className="small">
          <span className="fw-semibold">Simulate invalid card</span>
          <span className="d-block text-body-secondary">
            The card will be declined if you win an auction. Use it to test the fallback.
          </span>
        </label>
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? 'Saving…' : saved ? 'Replace card' : 'Save card'}
      </Button>
    </form>
  )
}
