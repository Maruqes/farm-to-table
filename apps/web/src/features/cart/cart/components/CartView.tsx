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
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-12">
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
