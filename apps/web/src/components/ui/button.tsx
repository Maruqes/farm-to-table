import type { ComponentProps } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/components/ui/utils'

// Painted price board buttons (RULES.md): square, 2px ink border, hover inverts.
const VARIANT = {
  default:
    'border-ink bg-ink text-paper hover:bg-transparent hover:text-ink',
  destructive:
    'border-alarm bg-alarm text-paper hover:bg-transparent hover:text-alarm',
  outline:
    'border-ink bg-transparent text-ink hover:bg-ink hover:text-paper',
  secondary:
    'border-ink bg-wash text-ink hover:bg-ink hover:text-paper',
  ghost: 'border-transparent bg-transparent text-ink hover:border-ink',
  link: 'border-transparent bg-transparent text-ink underline underline-offset-4',
  amber:
    'border-amber bg-amber text-board hover:bg-transparent hover:text-amber',
}
const SIZE = {
  default: '',
  sm: '',
  lg: 'min-h-[3.25rem] px-7 text-base',
  icon: 'size-10 p-0',
}

type ButtonProps = ComponentProps<'button'> & {
  variant?: keyof typeof VARIANT
  size?: keyof typeof SIZE
  asChild?: boolean
}

export function Button({ className, variant = 'default', size = 'default', asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      className={cn(
        'inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 border-2 px-4 py-1.5 text-sm font-semibold whitespace-nowrap no-underline transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-65',
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...props}
    />
  )
}
