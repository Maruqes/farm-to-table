import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

interface AdminShortcutsProps {
  pendingProducers: number
  activeAuctions: number
}

interface Shortcut {
  to: string
  title: string
  description: string
  count: number
  countLabel: string
}

export function AdminShortcuts({ pendingProducers, activeAuctions }: AdminShortcutsProps) {
  const shortcuts: Shortcut[] = [
    {
      to: '/admin/producers',
      title: 'Producer approvals',
      description: 'Review new producers and let the right farms into the catalog.',
      count: pendingProducers,
      countLabel: 'waiting',
    },
    {
      to: '/admin/reviews',
      title: 'Reported reviews',
      description: 'Keep or hide reviews the community reported.',
      count: 0,
      countLabel: '',
    },
    {
      to: '/auctions',
      title: 'Live auctions',
      description: 'Open the auction list and follow the rooms running now.',
      count: activeAuctions,
      countLabel: 'live',
    },
    {
      to: '/admin/status',
      title: 'Service status',
      description: 'Check the API, database and image storage health.',
      count: 0,
      countLabel: '',
    },
  ]

  return (
    <section aria-labelledby="admin-shortcuts-heading" className="space-y-3">
      <div className="space-y-1">
        <h2 id="admin-shortcuts-heading" className="text-xl md:text-2xl">
          Admin tasks
        </h2>
        <p className="text-sm text-muted-foreground">
          Jump to the queues and panels that need an admin.
        </p>
      </div>

      <ul className="divide-y rounded-xl border bg-card">
        {shortcuts.map((shortcut) => (
          <li key={shortcut.to}>
            <Link
              to={shortcut.to}
              className="flex min-h-14 flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-accent md:px-6"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{shortcut.title}</span>
                <span className="block text-sm text-muted-foreground">
                  {shortcut.description}
                </span>
              </span>
              <span className="flex items-center gap-3">
                {shortcut.countLabel && (
                  <span className="text-sm text-muted-foreground">
                    <data value={shortcut.count} className="font-medium text-foreground tabular">
                      {shortcut.count}
                    </data>{' '}
                    {shortcut.countLabel}
                  </span>
                )}
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
