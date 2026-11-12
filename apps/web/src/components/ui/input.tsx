import type { ComponentProps } from 'react'
import { cn } from '@/components/ui/utils'

export function Input({ className, type, ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      className={cn(
        'block min-h-10 w-full border-2 border-ink bg-transparent px-3 py-1.5 text-[0.9375rem] text-ink placeholder:text-dim focus-visible:border-ink disabled:bg-wash aria-invalid:border-alarm',
        className,
      )}
      {...props}
    />
  )
}
