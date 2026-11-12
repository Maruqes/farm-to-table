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
    <section aria-labelledby="admin-shortcuts-heading" className="flex flex-col gap-4">
      <div>
        <h2 id="admin-shortcuts-heading">Admin tasks</h2>
        <p className="text-sm text-dim mb-0">
          Jump to the queues and panels that need an admin.
        </p>
      </div>

      <ul aria-label="Admin tasks" className="board">
        {shortcuts.map((shortcut) => (
          <li key={shortcut.to} className="board-row">
            <Link to={shortcut.to} className="group flex min-h-[3.5rem] flex-1 items-center justify-between gap-3 py-[0.7rem] no-underline">
              <span className="min-w-0 grow">
                <span className="block font-semibold group-hover:underline">{shortcut.title}</span>
                <span className="block text-sm text-dim">
                  {shortcut.description}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-3">
                {shortcut.countLabel && (
                  <span className="text-sm text-dim">
                    <data value={shortcut.count} className="font-semibold tabular">
                      {shortcut.count}
                    </data>{' '}
                    {shortcut.countLabel}
                  </span>
                )}
                <ArrowRight size={16} className="shrink-0 text-dim" aria-hidden="true" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
