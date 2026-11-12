import type { ComponentProps } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/components/ui/utils'

interface CheckoutFieldProps extends Omit<ComponentProps<'input'>, 'id'> {
  id: string
  label: string
  error?: string
}

export function CheckoutField({
  id,
  label,
  error,
  className,
  ...props
}: CheckoutFieldProps) {
  const errorId = `${id}-error`

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="label-line mb-1 block">
        {label}
      </label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          error && 'is-invalid',
          className,
        )}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-sm text-alarm">
          {error}
        </p>
      )}
    </div>
  )
}
