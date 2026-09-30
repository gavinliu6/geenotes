import { useState } from 'react'

import type { ButtonProps } from '@/components/ui/button'
import { Button } from '@/components/ui/button'
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { FieldError, Label } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { TextField } from '@/components/ui/text-field'

interface PasswordStepProps {
  title: string
  description: string
  submitLabel: string
  submitVariant?: ButtonProps['variant']
  /** Resolves to an error message when the password is rejected. */
  onSubmit: (password: string) => Promise<string | undefined>
}

export function PasswordStep({
  title,
  description,
  submitLabel,
  submitVariant = 'inverse',
  onSubmit,
}: PasswordStepProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string>()
  const [isPending, setIsPending] = useState(false)

  const submit = async () => {
    if (isPending) return

    if (!password) {
      setError('Password is required')

      return
    }

    setIsPending(true)

    try {
      setError(await onSubmit(password))
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <TextField
        type="password"
        autoComplete="current-password"
        autoFocus
        value={password}
        onChange={(value) => {
          setPassword(value)
          setError(undefined)
        }}
        isInvalid={!!error}
        validationBehavior="aria"
      >
        <Label>Password</Label>
        <Input />
        <FieldError>{error}</FieldError>
      </TextField>
      <DialogFooter>
        <Button slot="close">Cancel</Button>
        <Button type="submit" variant={submitVariant} isPending={isPending}>
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  )
}
