import type { ProducerDirectoryItem } from '../producers-directory.types'
import { ProducerCard } from './ProducerCard'

export function ProducerGrid({ producers }: { producers: ProducerDirectoryItem[] }) {
  return (
    <ul role="list" className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {producers.map((producer) => (
        <ProducerCard key={producer.id} producer={producer} />
      ))}
    </ul>
  )
}
