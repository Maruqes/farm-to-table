import type { ComponentProps } from 'react'
import { cn } from '@/components/ui/utils'

export function Input({ className, type, ...props }: ComponentProps<'input'>) {
  return <input type={type} className={cn('form-control', className)} {...props} />
}
