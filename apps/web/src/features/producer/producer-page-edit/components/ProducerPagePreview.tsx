import { lazy, Suspense } from 'react'
import { MapPin } from 'lucide-react'
import { PageState } from '@/components/PageState'
import {
  isWebPhotoUrl,
  toProducerPageInput,
} from '../producer-page-edit.validation'
import type {
  ProducerPage,
  ProducerPageFormValues,
} from '../producer-page-edit.types'
import { FarmPhoto } from './FarmPhoto'

const MapPicker = lazy(() =>
  import('./MapPicker').then((module) => ({ default: module.MapPicker })),
)

interface ProducerPagePreviewProps {
  page: ProducerPage
  values: ProducerPageFormValues
}

export function ProducerPagePreview({
  page,
  values,
}: ProducerPagePreviewProps) {
  const preview = toProducerPageInput(values)
  const hasCoordinates = preview.lat !== null && preview.lng !== null
  const hasPhoto = Boolean(preview.photoUrl) && isWebPhotoUrl(preview.photoUrl)
  const hasContent =
    Boolean(preview.bio) ||
    Boolean(preview.location) ||
    hasPhoto ||
    hasCoordinates

  if (!hasContent) {
    return (
      <PageState
        empty
        emptyMessage="Your public page is still empty. Add a bio, a locality, a photo or a map pin and buyers will see it here."
      />
    )
  }

  return (
    <article aria-label="Public page preview" className="frame">
      {hasPhoto && (
        <FarmPhoto
          src={preview.photoUrl}
          alt={`Photo of ${page.name}`}
          className="pa-rule-bottom"
        />
      )}

      <div className="vstack gap-4 p-4 p-md-5">
        <header className="vstack gap-2">
          <p className="label-line">Public page</p>
          <h3 className="fs-4 text-break">{page.name}</h3>
          {preview.location && (
            <p className="d-flex align-items-start gap-2 small text-body-secondary">
              <MapPin size={16} className="flex-shrink-0" aria-hidden="true" />
              <span className="min-w-0 text-break">{preview.location}</span>
            </p>
          )}
          <div aria-hidden="true" className="double-rule pt-1" />
        </header>

        {preview.bio && (
          <p className="measure text-break text-body-secondary">
            {preview.bio}
          </p>
        )}

        {hasCoordinates && preview.lat !== null && preview.lng !== null && (
          <section aria-labelledby="preview-map-heading" className="vstack gap-2 rule pt-4">
            <h4 id="preview-map-heading" className="label-line">
              Where to find them
            </h4>
            <Suspense
              fallback={
                <div
                  role="status"
                  className="frame w-100 pa-map d-flex align-items-center justify-content-center"
                >
                  <span className="visually-hidden">Loading map…</span>
                </div>
              }
            >
              <MapPicker
                lat={preview.lat}
                lng={preview.lng}
                interactive={false}
                className="pa-map-tall"
              />
            </Suspense>
          </section>
        )}
      </div>
    </article>
  )
}
