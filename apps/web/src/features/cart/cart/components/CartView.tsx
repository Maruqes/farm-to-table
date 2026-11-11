import type { CartGroup } from '../cart.types'
import { CartSummary } from './CartSummary'
import { ProducerCartGroup } from './ProducerCartGroup'

interface CartViewProps {
  groups: CartGroup[]
  saving: boolean
  onQuantityChange: (productId: string, quantity: number) => void
  onRemove: (productId: string) => void
}

export function CartView({
  groups,
  saving,
  onQuantityChange,
  onRemove,
}: CartViewProps) {
  const total = groups.reduce((sum, group) => sum + group.subtotal, 0)

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-4 md:space-y-6">
        {groups.map((group) => (
          <ProducerCartGroup
            key={group.producer.id || group.producer.name}
            group={group}
            onQuantityChange={onQuantityChange}
            onRemove={onRemove}
          />
        ))}
      </div>

      <CartSummary
        total={total}
        producerCount={groups.length}
        saving={saving}
      />
    </div>
  )
}
