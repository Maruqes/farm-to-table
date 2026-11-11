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
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
      <div className="min-w-0 space-y-1">
        <h2 className="text-base font-semibold break-words">{item.name}</h2>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <Badge variant={item.hidden ? 'secondary' : 'outline'}>
            {item.hidden ? (
              <EyeOff aria-hidden="true" />
            ) : (
              <Eye aria-hidden="true" />
            )}
            {itemStatusLabel(item.hidden)}
          </Badge>
          <span>{itemStatusDetail(item.hidden)}</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="h-11 w-full sm:w-auto"
        disabled={pending}
        onClick={() => onToggle(item, nextHidden)}
        aria-label={`${nextHidden ? 'Hide' : 'Unhide'} ${item.name}`}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : nextHidden ? (
          <EyeOff className="size-4" aria-hidden="true" />
        ) : (
          <Eye className="size-4" aria-hidden="true" />
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
      className="divide-y rounded-xl border bg-card"
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
