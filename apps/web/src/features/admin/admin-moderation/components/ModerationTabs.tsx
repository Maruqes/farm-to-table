import { useRef, type KeyboardEvent } from 'react'
import { CONTENT_TYPE_LABELS } from '../admin-moderation.labels'
import type { ContentType } from '../admin-moderation.types'

const TABS: { value: ContentType }[] = [
  { value: 'product' },
  { value: 'producer' },
]

interface ModerationTabsProps {
  value: ContentType
  onChange: (type: ContentType) => void
}

export function ModerationTabs({ value, onChange }: ModerationTabsProps) {
  const tabRefs = useRef<Partial<Record<ContentType, HTMLButtonElement | null>>>(
    {},
  )

  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    const last = TABS.length - 1
    let next = index

    if (event.key === 'ArrowRight') next = index === last ? 0 : index + 1
    else if (event.key === 'ArrowLeft') next = index === 0 ? last : index - 1
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = last
    else return

    event.preventDefault()
    const nextType = TABS[next].value
    onChange(nextType)
    tabRefs.current[nextType]?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label="Content type"
      className="flex flex-wrap gap-2"
    >
      {TABS.map((tab, index) => {
        const selected = tab.value === value
        return (
          <button
            key={tab.value}
            ref={(element) => {
              tabRefs.current[tab.value] = element
            }}
            type="button"
            role="tab"
            id={`moderation-tab-${tab.value}`}
            aria-selected={selected}
            aria-controls={selected ? `moderation-panel-${tab.value}` : undefined}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`inline-flex min-h-11 items-center justify-center rounded-full border px-5 text-sm font-semibold transition-colors ${
              selected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'bg-background hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            {CONTENT_TYPE_LABELS[tab.value]}
          </button>
        )
      })}
    </div>
  )
}
