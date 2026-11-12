import type { ComponentProps, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/components/ui/utils'

interface TextFieldProps extends Omit<ComponentProps<'input'>, 'id'> {
  id: string
  label: string
  error?: string
  hint?: string
}

export function TextField({ id, label, error, hint, className, ...props }: TextFieldProps) {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  return (
    <div className="vstack gap-1">
      <label htmlFor={id} className="form-label d-block">
        {label}
      </label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        className={cn(error && 'is-invalid', className)}
        {...props}
      />
      {error ? (
        <p id={errorId} className="invalid-feedback d-block">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="form-text mb-0">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="frame-alarm d-flex gap-2 px-3 py-2 small text-danger"
    >
      <AlertTriangle size={16} className="mt-1 flex-shrink-0" aria-hidden="true" />
      <p className="mb-0">{children}</p>
    </div>
  )
}
