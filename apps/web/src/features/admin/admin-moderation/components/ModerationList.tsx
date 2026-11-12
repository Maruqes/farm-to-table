import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  itemStatusDetail,
  itemStatusLabel,
} from '../admin-moderation.labels'
import type {
  AdminContentItem,
  ModerationActionResult,
} from '../admin-moderation.types'

interface ModerationRowProps {
  item: AdminContentItem
  pending: boolean
  onToggle: (item: AdminContentItem, hidden: boolean) => void
}

function ModerationRow({ item, pending, onToggle }: ModerationRowProps) {
  const nextHidden = !item.hidden

  return (
    <li className="d-flex flex-column flex-md-row align-items-md-center justify-content-md-between gap-3 py-3 border-bottom">
      <div className="min-w-0 vstack gap-1">
        <h2 className="text-break">{item.name}</h2>
        <div className="d-flex flex-wrap align-items-center column-gap-2 row-gap-1 small text-body-secondary">
          <Badge variant={item.hidden ? 'secondary' : 'outline'}>
            {item.hidden ? (
              <EyeOff size={16} aria-hidden="true" />
            ) : (
              <Eye size={16} aria-hidden="true" />
            )}
            {itemStatusLabel(item.hidden)}
          </Badge>
          <span>{itemStatusDetail(item.hidden)}</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() => onToggle(item, nextHidden)}
        aria-label={`${nextHidden ? 'Hide' : 'Unhide'} ${item.name}`}
      >
        {pending ? (
          <Loader2 size={16} className="spin" aria-hidden="true" />
        ) : nextHidden ? (
          <EyeOff size={16} aria-hidden="true" />
        ) : (
          <Eye size={16} aria-hidden="true" />
        )}
        {pending ? 'Saving…' : nextHidden ? 'Hide' : 'Unhide'}
      </Button>
    </li>
  )
}

interface ModerationListProps {
  items: AdminContentItem[]
  pending: Record<string, boolean>
  listLabel: string
  onToggle: (
    item: AdminContentItem,
    hidden: boolean,
  ) => Promise<ModerationActionResult>
}

export function ModerationList({
  items,
  pending,
  listLabel,
  onToggle,
}: ModerationListProps) {
  return (
    <ul
      aria-label={listLabel}
      className="board"
    >
      {items.map((item) => (
        <ModerationRow
          key={item.id}
          item={item}
          pending={pending[item.id] === true}
          onToggle={(entry, hidden) => {
            void onToggle(entry, hidden)
          }}
        />
      ))}
    </ul>
  )
}
