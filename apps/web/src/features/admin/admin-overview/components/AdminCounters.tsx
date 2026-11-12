import type { AdminOverviewSummary } from '../admin-overview.types'

interface AdminCountersProps {
  summary: AdminOverviewSummary
}

export function AdminCounters({ summary }: AdminCountersProps) {
  const counters = [
    {
      label: 'Users',
      value: summary.users,
      hint: 'Buyers and producers',
    },
    {
      label: 'Orders',
      value: summary.orders,
      hint: 'Across every producer',
    },
    {
      label: 'Live auctions',
      value: summary.activeAuctions,
      hint: 'Running right now',
    },
    {
      label: 'Pending producers',
      value: summary.pendingProducers,
      hint: 'Waiting for approval',
    },
  ]

  return (
    <dl className="board" aria-label="Marketplace totals">
      {counters.map((counter) => (
        <div key={counter.label} className="flex items-baseline justify-between gap-4 border-b border-dim py-[0.7rem]">
          <dt className="min-w-0">
            <span className="label-line">{counter.label}</span>
            <span className="block text-sm text-dim">
              {counter.hint}
            </span>
          </dt>
          <dd className="shrink-0 text-right">
            <data value={counter.value} className="price tabular">
              {counter.value}
            </data>
          </dd>
        </div>
      ))}
    </dl>
  )
}
