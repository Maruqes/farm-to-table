import { Toaster as SonnerToaster, type ToasterProps } from 'sonner'

// Styled in styles/globals.css ([data-sonner-toast]).
export function Toaster(props: ToasterProps) {
  return <SonnerToaster position="top-right" closeButton {...props} />
}
