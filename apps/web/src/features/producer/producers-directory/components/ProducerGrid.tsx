import type { ProducerDirectoryItem } from '../producers-directory.types'
import { ProducerCard } from './ProducerCard'

export function ProducerGrid({ producers }: { producers: ProducerDirectoryItem[] }) {
  return (
    <ul role="list" className="board">
      {producers.map((producer) => (
        <ProducerCard key={producer.id} producer={producer} />
      ))}
    </ul>
  )
}
