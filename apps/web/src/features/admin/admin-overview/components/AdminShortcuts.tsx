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
    <section aria-labelledby="admin-shortcuts-heading" className="vstack gap-3">
      <div>
        <h2 id="admin-shortcuts-heading">Admin tasks</h2>
        <p className="small text-body-secondary mb-0">
          Jump to the queues and panels that need an admin.
        </p>
      </div>

      <ul aria-label="Admin tasks" className="board">
        {shortcuts.map((shortcut) => (
          <li key={shortcut.to} className="board-row">
            <Link to={shortcut.to} className="admin-shortcut-link">
              <span className="min-w-0 flex-grow-1">
                <span className="d-block fw-semibold admin-shortcut-title">{shortcut.title}</span>
                <span className="d-block small text-body-secondary">
                  {shortcut.description}
                </span>
              </span>
              <span className="d-flex flex-shrink-0 align-items-center gap-3">
                {shortcut.countLabel && (
                  <span className="small text-body-secondary">
                    <data value={shortcut.count} className="fw-semibold tabular">
                      {shortcut.count}
                    </data>{' '}
                    {shortcut.countLabel}
                  </span>
                )}
                <ArrowRight size={16} className="flex-shrink-0 text-body-secondary" aria-hidden="true" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
