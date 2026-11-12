import type { ComponentProps, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/components/ui/utils'

function FieldMessage({
  id,
  error,
  hint,
}: {
  id: string
  error?: string
  hint?: string
}) {
  if (error) {
    return (
      <p id={`${id}-error`} className="text-sm text-alarm">
        {error}
      </p>
    )
  }
  if (hint) {
    return (
      <p id={`${id}-hint`} className="text-sm text-dim">
        {hint}
      </p>
    )
  }
  return null
}

function describedBy(
  id: string,
  error?: string,
  hint?: string,
): string | undefined {
  if (error) return `${id}-error`
  if (hint) return `${id}-hint`
  return undefined
}

interface TextFieldProps extends Omit<ComponentProps<'input'>, 'id'> {
  id: string
  label: string
  error?: string
  hint?: string
}

export function TextField({
  id,
  label,
  error,
  hint,
  className,
  ...props
}: TextFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(error && 'is-invalid', className)}
        {...props}
      />
      <FieldMessage id={id} error={error} hint={hint} />
    </div>
  )
}

interface TextareaFieldProps extends Omit<ComponentProps<'textarea'>, 'id'> {
  id: string
  label: string
  error?: string
  hint?: string
  counter?: ReactNode
}

export function TextareaField({
  id,
  label,
  error,
  hint,
  counter,
  className,
  ...props
}: TextareaFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <label htmlFor={id} className="form-label">
          {label}
        </label>
        {counter && (
          <span className="tabular text-xs text-dim">{counter}</span>
        )}
      </div>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(
          'form-control min-h-36 resize-y',
          error && 'is-invalid',
          className,
        )}
        {...props}
      />
      <FieldMessage id={id} error={error} hint={hint} />
    </div>
  )
}

export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-2 border-2 border-alarm p-2 px-3 text-sm text-alarm [&>p]:m-0 [&>svg]:mt-0.5 [&>svg]:shrink-0">
      <AlertTriangle size={16} aria-hidden="true" />
      <p>{children}</p>
    </div>
  )
}
