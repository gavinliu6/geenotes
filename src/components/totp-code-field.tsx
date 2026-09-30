import { Description, FieldError, Label } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { OTPFieldProps } from '@/components/ui/otp-field'
import { OTPField, OTPFieldGroup } from '@/components/ui/otp-field'

export const TOTP_LENGTH = 6

interface TotpCodeFieldProps extends Omit<
  OTPFieldProps,
  'length' | 'children' | 'isInvalid'
> {
  label: string
  description?: string
  error?: string
  autoFocus?: boolean
}

export function focusFirstDigit(field: HTMLElement | null) {
  field
    ?.querySelector<HTMLInputElement>('[data-slot="otp-field-input"]')
    ?.focus()
}

export function TotpCodeField({
  label,
  description,
  error,
  autoFocus,
  ...props
}: TotpCodeFieldProps) {
  return (
    <OTPField length={TOTP_LENGTH} isInvalid={!!error} {...props}>
      <Label>{label}</Label>
      <OTPFieldGroup>
        {Array.from({ length: TOTP_LENGTH }, (_, index) => (
          <Input
            key={index}
            size="lg"
            autoFocus={autoFocus && index === 0}
            aria-label={index === 0 ? undefined : `Digit ${index + 1}`}
          />
        ))}
      </OTPFieldGroup>
      {description && <Description>{description}</Description>}
      <FieldError>{error}</FieldError>
    </OTPField>
  )
}
