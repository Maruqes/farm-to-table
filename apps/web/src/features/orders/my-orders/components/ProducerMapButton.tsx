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
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 dark:bg-background/80 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-card p-5 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 md:p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Dialog.Title className="text-xl">{producer.name}</Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
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
                className="h-64 w-full animate-pulse rounded-xl border bg-muted md:h-80"
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
