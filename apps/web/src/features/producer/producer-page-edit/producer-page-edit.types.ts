// Domain model consumed by components. API shapes stay in producer-page-edit.dto.ts.

export interface ProducerPage {
  id: string
  name: string
  bio: string
  location: string
  lat: number | null
  lng: number | null
  photoUrl: string
}

export interface ProducerPageInput {
  bio: string
  location: string
  lat: number | null
  lng: number | null
  photoUrl: string
}

export interface ProducerPageFormValues {
  bio: string
  location: string
  lat: string
  lng: string
  photoUrl: string
}

export type ProducerPageFieldErrors = Partial<
  Record<'bio' | 'location' | 'lat' | 'lng' | 'photoUrl', string>
>
