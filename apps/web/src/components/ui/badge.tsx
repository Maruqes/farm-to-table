import type { ComponentProps } from 'react'
import { cn } from '@/components/ui/utils'

// Bootstrap badge, themed in styles/_components.scss. State is always text, never colour alone.
const VARIANT = {
  default: '',
  secondary: 'badge-secondary',
  destructive: 'badge-danger',
  outline: 'badge-outline',
  live: 'badge-live',
}

export function Badge({
  className,
  variant = 'default',
  ...props
}: ComponentProps<'span'> & { variant?: keyof typeof VARIANT }) {
  return <span className={cn('badge', VARIANT[variant], className)} {...props} />
}
