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
    <li className="flex flex-col gap-4 border-b border-dim py-4 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 flex flex-col gap-1">
        <h2 className="break-words font-sans text-base font-semibold normal-case leading-[1.4]">{item.name}</h2>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-dim">
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
