import { lazy, Suspense, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  isWebPhotoUrl,
  MAX_BIO_LENGTH,
  toProducerPageInput,
} from '../producer-page-edit.validation'
import type {
  ProducerPageFieldErrors,
  ProducerPageFormValues,
} from '../producer-page-edit.types'
import { FarmPhoto } from './FarmPhoto'
import { FormAlert, TextareaField, TextField } from './FormField'

const MapPicker = lazy(() =>
  import('./MapPicker').then((module) => ({ default: module.MapPicker })),
)

interface ProducerPageFormProps {
  values: ProducerPageFormValues
  errors: ProducerPageFieldErrors
  formError: string | null
  saving: boolean
  onChange: <Field extends keyof ProducerPageFormValues>(
    field: Field,
    value: ProducerPageFormValues[Field],
  ) => void
  onPick: (lat: number, lng: number) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function ProducerPageForm({
  values,
  errors,
  formError,
  saving,
  onChange,
  onPick,
  onSubmit,
}: ProducerPageFormProps) {
  const coordinates = toProducerPageInput(values)
  const photoUrl = values.photoUrl.trim()
  const previewPhotoUrl = isWebPhotoUrl(photoUrl) ? photoUrl : ''

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={saving} className="space-y-6">
      {formError && <FormAlert>{formError}</FormAlert>}

      <TextareaField
        id="bio"
        label="Bio"
        value={values.bio}
        onChange={(event) => onChange('bio', event.target.value)}
        error={errors.bio}
        hint="What you grow, how you work and what makes your farm worth a visit."
        counter={`${values.bio.length}/${MAX_BIO_LENGTH}`}
        maxLength={MAX_BIO_LENGTH}
        rows={6}
        required={false}
      />

      <TextField
        id="location"
        label="Locality"
        value={values.location}
        onChange={(event) => onChange('location', event.target.value)}
        error={errors.location}
        hint="For example: Ponte de Lima, Minho."
        autoComplete="address-level2"
        maxLength={120}
        required
      />

      <div className="space-y-2">
        <TextField
          id="photoUrl"
          label="Photo URL"
          type="url"
          inputMode="url"
          value={values.photoUrl}
          onChange={(event) => onChange('photoUrl', event.target.value)}
          error={errors.photoUrl}
          hint="Paste a link to a photo of your farm. JPG, PNG or WebP."
          autoComplete="off"
          spellCheck={false}
        />
        <FarmPhoto
          src={previewPhotoUrl}
          alt="Preview of your farm photo"
          emptyLabel="Photo preview"
          className="aspect-[16/9] w-full max-w-sm rounded-lg"
        />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Map pin</legend>
        <p className="text-sm text-muted-foreground">
          Optional. Add both coordinates or click the map to show where buyers
          can find you.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="lat"
            label="Latitude"
            inputMode="decimal"
            value={values.lat}
            onChange={(event) => onChange('lat', event.target.value)}
            error={errors.lat}
            placeholder="41.1632"
            autoComplete="off"
          />
          <TextField
            id="lng"
            label="Longitude"
            inputMode="decimal"
            value={values.lng}
            onChange={(event) => onChange('lng', event.target.value)}
            error={errors.lng}
            placeholder="-7.5435"
            autoComplete="off"
          />
        </div>
        <Suspense
          fallback={
            <div
              role="status"
              className="h-64 w-full animate-pulse rounded-xl border bg-muted md:h-72"
            >
              <span className="sr-only">Loading map…</span>
            </div>
          }
        >
          <MapPicker
            lat={coordinates.lat}
            lng={coordinates.lng}
            onPick={onPick}
          />
        </Suspense>
      </fieldset>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-5">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save page'}
        </Button>
        <p className="text-sm text-muted-foreground">
          Your changes appear on the public page right after saving.
        </p>
      </div>
    </form>
  )
}
