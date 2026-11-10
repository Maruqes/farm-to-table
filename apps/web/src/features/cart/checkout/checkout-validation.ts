import type { CheckoutAddress, CheckoutFieldErrors } from './checkout.types'

export type AddressField = keyof CheckoutAddress

export function validateAddress(address: CheckoutAddress): CheckoutFieldErrors {
  const errors: CheckoutFieldErrors = {}
  if (!address.line1.trim()) errors.line1 = 'Address line is required.'
  if (!address.city.trim()) errors.city = 'City is required.'
  if (!address.postalCode.trim()) errors.postalCode = 'Postal code is required.'
  return errors
}

export function hasErrors(errors: CheckoutFieldErrors): boolean {
  return Object.values(errors).some(Boolean)
}

export function focusFirstError(errors: CheckoutFieldErrors): void {
  requestAnimationFrame(() => {
    for (const field of Object.keys(errors)) {
      if (!errors[field as AddressField]) continue
      const element = document.getElementById(field)
      if (element) {
        element.focus()
        return
      }
    }
  })
}
