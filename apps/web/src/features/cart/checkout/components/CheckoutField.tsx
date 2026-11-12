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
    <div className="vstack gap-2">
      <label htmlFor={id} className="label-line d-block mb-0">
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
        <p id={errorId} className="small text-danger mb-0">
          {error}
        </p>
      )}
    </div>
  )
}
