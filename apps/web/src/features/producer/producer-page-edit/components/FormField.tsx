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
      <p id={`${id}-error`} className="small text-danger">
        {error}
      </p>
    )
  }
  if (hint) {
    return (
      <p id={`${id}-hint`} className="small text-body-secondary">
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
    <div className="vstack gap-2">
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
    <div className="vstack gap-2">
      <div className="d-flex flex-wrap align-items-baseline justify-content-between gap-2">
        <label htmlFor={id} className="form-label">
          {label}
        </label>
        {counter && (
          <span className="tabular pa-xs text-body-secondary">{counter}</span>
        )}
      </div>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(
          'form-control pa-textarea',
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
    <div role="alert" className="pa-alert-error">
      <AlertTriangle size={16} aria-hidden="true" />
      <p>{children}</p>
    </div>
  )
}
