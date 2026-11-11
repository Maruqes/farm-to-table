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
    <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-y py-5 md:grid-cols-4">
      {counters.map((counter) => (
        <div key={counter.label} className="space-y-1">
          <dt className="text-sm text-muted-foreground">{counter.label}</dt>
          <dd>
            <data
              value={counter.value}
              className="block font-display text-2xl font-extrabold tabular md:text-3xl"
            >
              {counter.value}
            </data>
            <span className="mt-1 block text-xs text-muted-foreground">{counter.hint}</span>
          </dd>
        </div>
      ))}
    </dl>
  )
}
