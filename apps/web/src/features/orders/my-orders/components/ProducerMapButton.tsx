import { lazy, Suspense } from 'react'
import { Dialog } from 'radix-ui'
import { MapPin, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { OrderProducer } from '../my-orders.types'

const ProducerMap = lazy(() =>
  import('@/features/producer/producer-public/components/ProducerMap').then(
    (module) => ({ default: module.ProducerMap }),
  ),
)

export function ProducerMapButton({ producer }: { producer: OrderProducer }) {
  const { lat, lng } = producer
  if (lat === null || lng === null) return null

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button variant="outline" aria-label={`Show ${producer.name} on the map`}>
          <MapPin aria-hidden="true" />
          Map
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-panel">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <Dialog.Title>{producer.name}</Dialog.Title>
              <Dialog.Description className="text-sm text-dim">
                {producer.location || 'Approximate location on the map.'}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close map">
                <X aria-hidden="true" />
              </Button>
            </Dialog.Close>
          </div>

          <Suspense
            fallback={
              <div
                role="status"
                className="h-64 w-full border border-dim md:h-80"
              >
                <span className="sr-only">Loading map…</span>
              </div>
            }
          >
            <ProducerMap lat={lat} lng={lng} name={producer.name} />
          </Suspense>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
