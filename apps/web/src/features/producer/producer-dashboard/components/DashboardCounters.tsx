import { formatMoney } from '@/services/format'
import type { ProducerDashboardStats } from '../producer-dashboard.types'

interface DashboardCountersProps {
  stats: ProducerDashboardStats
}

export function DashboardCounters({ stats }: DashboardCountersProps) {
  const counters = [
    {
      label: 'Sales',
      value: formatMoney(stats.sales),
      hint: 'Revenue from your products',
    },
    {
      label: 'Orders to handle',
      value: String(stats.toHandle),
      hint: 'Customers waiting on you',
    },
    {
      label: 'Active products',
      value: String(stats.activeProducts),
      hint: 'Listed in the catalog',
    },
    {
      label: 'Average rating',
      value: stats.averageRating > 0 ? `${stats.averageRating.toFixed(1)} / 5` : '—',
      hint: stats.averageRating > 0 ? 'From delivered orders' : 'No ratings yet',
    },
  ]

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-y py-5 md:grid-cols-4">
      {counters.map((counter) => (
        <div key={counter.label} className="space-y-1">
          <dt className="text-sm text-muted-foreground">{counter.label}</dt>
          <dd>
            <span className="block font-display text-2xl font-extrabold tabular md:text-3xl">
              {counter.value}
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">{counter.hint}</span>
          </dd>
        </div>
      ))}
    </dl>
  )
}
