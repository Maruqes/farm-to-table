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
      raw: stats.sales,
      hint: 'Revenue from your products',
    },
    {
      label: 'Orders to handle',
      value: String(stats.toHandle),
      raw: stats.toHandle,
      hint: 'Customers waiting on you',
    },
    {
      label: 'Active products',
      value: String(stats.activeProducts),
      raw: stats.activeProducts,
      hint: 'Listed in the catalog',
    },
    {
      label: 'Average rating',
      value: stats.averageRating > 0 ? `${stats.averageRating.toFixed(1)} / 5` : '—',
      raw: stats.averageRating,
      hint: stats.averageRating > 0 ? 'From delivered orders' : 'No ratings yet',
    },
  ]

  return (
    <dl className="board">
      {counters.map((counter) => (
        <div key={counter.label} className="board-row flex-wrap">
          <dt className="min-w-0 grow">
            <span className="label-line">{counter.label}</span>
            <span className="mt-1 block text-sm text-dim">
              {counter.hint}
            </span>
          </dt>
          <dd className="price">
            <data value={counter.raw} className="tabular">
              {counter.value}
            </data>
          </dd>
        </div>
      ))}
    </dl>
  )
}
