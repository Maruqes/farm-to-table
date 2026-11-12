import type { ComponentProps } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/components/ui/utils'

// Bootstrap buttons, themed in styles/_components.scss.
const VARIANT = {
  default: 'btn-primary',
  destructive: 'btn-danger',
  outline: 'btn-outline-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  link: 'btn-link',
  amber: 'btn-amber',
}
const SIZE = { default: '', sm: 'btn-sm', lg: 'btn-lg', icon: 'btn-icon' }

type ButtonProps = ComponentProps<'button'> & {
  variant?: keyof typeof VARIANT
  size?: keyof typeof SIZE
  asChild?: boolean
}

export function Button({ className, variant = 'default', size = 'default', asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn('btn', VARIANT[variant], SIZE[size], className)} {...props} />
}
