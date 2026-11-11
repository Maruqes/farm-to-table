// API shapes assumed by FE-17. Every field may be missing or renamed later.
// GET /api/producers/me -> the signed-in producer's public page ; producer token required.
// PUT /api/producers/me -> 200 with the updated page ; 400 VALIDATION_ERROR with `fields`.

export interface ProducerPageDto {
  id?: string
  _id?: string
  name?: string
  bio?: string
  location?: string
  lat?: number
  lng?: number
  photoUrl?: string
}

export interface SaveProducerPageRequestDto {
  bio: string
  location: string
  lat: number | null
  lng: number | null
  photoUrl: string
}
