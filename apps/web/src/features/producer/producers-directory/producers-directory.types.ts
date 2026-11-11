export interface ProducersDirectoryQuery {
  q?: string
  location?: string
}

export interface ProducerDirectoryItem {
  id: string
  name: string
  location: string
  averageRating: number | null
  productCount: number
}
