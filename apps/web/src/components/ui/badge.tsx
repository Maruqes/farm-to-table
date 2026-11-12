import type { ComponentProps } from 'react'
import { cn } from '@/components/ui/utils'

// Painted price board badges (RULES.md). State is always text, never colour alone.
const VARIANT = {
  default: 'border-ink bg-ink text-paper',
  secondary: 'border-ink bg-wash text-ink',
  destructive: 'border-alarm bg-alarm text-paper',
  outline: 'border-ink bg-transparent text-ink',
  live: 'border-tag bg-tag text-tag-ink',
}

export function Badge({
  className,
  variant = 'default',
  ...props
}: ComponentProps<'span'> & { variant?: keyof typeof VARIANT }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 border px-[0.65em] py-[0.35em] text-[0.75em] leading-none font-semibold tracking-normal uppercase',
        VARIANT[variant],
        className,
      )}
      {...props}
    />
  )
}
