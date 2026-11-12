import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { PageState } from '@/components/PageState'
import { ApiError } from '@/services/api'
import {
  focusFirstError,
  pickFieldErrors,
  toProducerPageInput,
  validateProducerPageForm,
} from '../producer-page-edit.validation'
import type {
  ProducerPage,
  ProducerPageFieldErrors,
  ProducerPageFormValues,
  ProducerPageInput,
} from '../producer-page-edit.types'
import { useProducerPageEdit } from '../useProducerPageEdit'
import { ProducerPageForm } from './ProducerPageForm'
import { ProducerPagePreview } from './ProducerPagePreview'

function toFormValues(page: ProducerPage): ProducerPageFormValues {
  return {
    bio: page.bio,
    location: page.location,
    lat: page.lat !== null ? String(page.lat) : '',
    lng: page.lng !== null ? String(page.lng) : '',
    photoUrl: page.photoUrl,
  }
}

function withoutField(
  errors: ProducerPageFieldErrors,
  field: keyof ProducerPageFieldErrors,
): ProducerPageFieldErrors {
  if (!errors[field]) return errors
  const next = { ...errors }
  delete next[field]
  return next
}

interface ProducerPageEditorProps {
  page: ProducerPage
  onSave: (input: ProducerPageInput) => Promise<ProducerPage>
}

function ProducerPageEditor({ page, onSave }: ProducerPageEditorProps) {
  const [values, setValues] = useState<ProducerPageFormValues>(() =>
    toFormValues(page),
  )
  const [errors, setErrors] = useState<ProducerPageFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function update<Field extends keyof ProducerPageFormValues>(
    field: Field,
    value: ProducerPageFormValues[Field],
  ) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => withoutField(current, field))
    setFormError(null)
  }

  function handlePick(lat: number, lng: number) {
    setValues((current) => ({ ...current, lat: String(lat), lng: String(lng) }))
    setErrors((current) => withoutField(withoutField(current, 'lat'), 'lng'))
    setFormError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return

    const nextErrors = validateProducerPageForm(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setFormError('Please check the highlighted fields and try again.')
      focusFirstError(nextErrors)
      return
    }

    setSaving(true)
    setFormError(null)
    try {
      const saved = await onSave(toProducerPageInput(values))
      setValues(toFormValues(saved))
      toast.success('Public page saved.')
    } catch (cause) {
      if (cause instanceof ApiError) {
        const fieldErrors = pickFieldErrors(cause.fields)
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors)
          setFormError('Some details need attention. Check the highlighted fields.')
          focusFirstError(fieldErrors)
        } else {
          setFormError(cause.message)
        }
      } else {
        setFormError(
          'The page could not be saved. Check your connection and try again.',
        )
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="row g-4 align-items-start">
      <section aria-labelledby="page-details-heading" className="col-lg-6 min-w-0 vstack gap-3">
        <div className="vstack gap-1">
          <h2 id="page-details-heading">Page details</h2>
          <p className="small text-body-secondary">
            The name comes from your account. Everything else is yours to edit.
          </p>
        </div>
        <div className="rule pt-4">
          <ProducerPageForm
            values={values}
            errors={errors}
            formError={formError}
            saving={saving}
            onChange={update}
            onPick={handlePick}
            onSubmit={handleSubmit}
          />
        </div>
      </section>

      <section
        aria-labelledby="page-preview-heading"
        className="col-lg-6 min-w-0 vstack gap-3 pa-sticky-preview"
      >
        <div className="vstack gap-1">
          <h2 id="page-preview-heading">Preview</h2>
          <p className="small text-body-secondary">
            Updates as you type. This is what buyers see.
          </p>
        </div>
        <ProducerPagePreview page={page} values={values} />
      </section>
    </div>
  )
}

export function ProducerPageEditView() {
  const { page, loading, error, reload, save } = useProducerPageEdit()

  return (
    <section aria-labelledby="producer-page-edit-heading" className="vstack gap-4">
      <Link to="/producer" className="pa-back-link small text-body-secondary">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to dashboard
      </Link>

      <header className="vstack gap-1">
        <h1 id="producer-page-edit-heading">Public page</h1>
        <p className="measure text-body-secondary">
          The page buyers read before they order. Tell them who you are, where
          to find you and what makes your farm worth a visit.
        </p>
      </header>

      <PageState
        loading={loading}
        error={error}
        errorMessage={error ?? undefined}
        onRetry={reload}
      >
        {page && (
          <ProducerPageEditor key={page.id} page={page} onSave={save} />
        )}
      </PageState>
    </section>
  )
}
