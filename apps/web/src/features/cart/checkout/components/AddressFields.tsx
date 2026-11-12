import type { CheckoutAddress, CheckoutFieldErrors } from '../checkout.types'
import type { AddressField } from '../checkout-validation'
import { CheckoutField } from './CheckoutField'

interface AddressFieldsProps {
  address: CheckoutAddress
  errors: CheckoutFieldErrors
  disabled: boolean
  onChange: (field: AddressField, value: string) => void
  onBlur: (field: AddressField) => void
}

export function AddressFields({
  address,
  errors,
  disabled,
  onChange,
  onBlur,
}: AddressFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <CheckoutField
        id="line1"
        name="line1"
        label="Address"
        autoComplete="street-address"
        value={address.line1}
        error={errors.line1}
        disabled={disabled}
        onChange={(event) => onChange('line1', event.target.value)}
        onBlur={() => onBlur('line1')}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <CheckoutField
          id="city"
          name="city"
          label="City"
          autoComplete="address-level2"
          value={address.city}
          error={errors.city}
          disabled={disabled}
          onChange={(event) => onChange('city', event.target.value)}
          onBlur={() => onBlur('city')}
        />
        <CheckoutField
          id="postalCode"
          name="postalCode"
          label="Postal code"
          autoComplete="postal-code"
          inputMode="numeric"
          value={address.postalCode}
          error={errors.postalCode}
          disabled={disabled}
          onChange={(event) => onChange('postalCode', event.target.value)}
          onBlur={() => onBlur('postalCode')}
        />
      </div>
    </div>
  )
}
