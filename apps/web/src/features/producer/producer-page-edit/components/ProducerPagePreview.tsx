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
    <article
      aria-label="Public page preview"
      className="overflow-hidden rounded-xl border bg-card"
    >
      {hasPhoto && (
        <FarmPhoto
          src={preview.photoUrl}
          alt={`Photo of ${page.name}`}
          className="aspect-[16/9] w-full"
        />
      )}

      <div className="space-y-5 p-5 md:p-6">
        <header className="space-y-2">
          <h3 className="text-2xl font-extrabold break-words">{page.name}</h3>
          {preview.location && (
            <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 break-words">{preview.location}</span>
            </p>
          )}
        </header>

        {preview.bio && (
          <p className="max-w-[65ch] break-words leading-relaxed text-muted-foreground">
            {preview.bio}
          </p>
        )}

        {hasCoordinates && preview.lat !== null && preview.lng !== null && (
          <section aria-labelledby="preview-map-heading" className="space-y-2">
            <h4 id="preview-map-heading" className="text-lg">
              Where to find them
            </h4>
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
                lat={preview.lat}
                lng={preview.lng}
                interactive={false}
                className="h-64 md:h-80"
              />
            </Suspense>
          </section>
        )}
      </div>
    </article>
  )
}
