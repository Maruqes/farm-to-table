import { Toaster as SonnerToaster, type ToasterProps } from 'sonner'

export function Toaster(props: ToasterProps) {
  return (
    <SonnerToaster
      className="toaster group"
      position="top-right"
      closeButton
      richColors
      {...props}
    />
  )
}
