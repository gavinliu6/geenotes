import type { AnyFieldApi } from '@tanstack/react-form'
import { revalidateLogic, useForm, useSelector } from '@tanstack/react-form'
import { useRouter } from '@tanstack/react-router'
import { CircleCheckIcon, CircleIcon } from 'lucide-react'
import type * as React from 'react'
import { useId, useRef, useState } from 'react'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { FieldError, Label } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { TextField } from '@/components/ui/text-field'
import { toastManager } from '@/components/ui/toast'
import { Tooltip, TooltipContent } from '@/components/ui/tooltip'
import { useIsMobile } from '@/hooks/use-mobile'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { setPassword } from '@/utils/account.functions'
import { newPasswordSchema, passwordRequirements } from '@/utils/schemas'

import { SettingsSection } from './settings-section'

const newPasswordFields = {
  newPassword: newPasswordSchema,
  confirmPassword: z.string(),
}

const passwordsMatch = {
  check: (value: { newPassword: string, confirmPassword: string }) =>
    value.newPassword === value.confirmPassword,
  params: { message: 'Passwords don\'t match', path: ['confirmPassword'] },
}

const setPasswordFormSchema = z
  .object(newPasswordFields)
  .refine(passwordsMatch.check, passwordsMatch.params)

const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    ...newPasswordFields,
  })
  .refine(passwordsMatch.check, passwordsMatch.params)

interface ChangePasswordSectionProps {
  email: string
  hasPassword: boolean
}

export function ChangePasswordSection({
  email,
  hasPassword,
}: ChangePasswordSectionProps) {
  return (
    <SettingsSection title={hasPassword ? 'Change password' : 'Set password'}>
      {hasPassword
        ? <ChangePasswordForm email={email} />
        : (
            <>
              <p className="text-sm text-fg-muted">
                You sign in with GitHub. Add a password to also sign in with
                {' '}
                {email}
                {' '}
                and to turn on two-factor authentication.
              </p>
              <SetPasswordForm email={email} />
            </>
          )}
    </SettingsSection>
  )
}

function ChangePasswordForm({ email }: { email: string }) {
  const form = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: changePasswordFormSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const { error } = await authClient.changePassword({
        currentPassword: value.currentPassword,
        newPassword: value.newPassword,
        revokeOtherSessions: true,
      })

      if (error) {
        toastManager.add({
          type: 'error',
          description: error.message || 'Failed to update password',
        })

        return
      }

      formApi.reset()
      toastManager.add({
        type: 'success',
        description: 'Password updated. Your other devices have been signed out.',
      })
    },
  })

  const isSubmitting = useSelector(form.store, state => state.isSubmitting)

  return (
    <form
      className="flex max-w-md flex-col gap-5"
      method="post"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <UsernameField email={email} />
      <form.Field name="currentPassword">
        {field => (
          <PasswordField
            field={field}
            label="Current password"
            autoComplete="current-password"
          />
        )}
      </form.Field>
      <form.Field name="newPassword">
        {field => (
          <PasswordField
            field={field}
            label="New password"
            autoComplete="new-password"
            showRequirements
          />
        )}
      </form.Field>
      <form.Field name="confirmPassword">
        {field => (
          <PasswordField
            field={field}
            label="Confirm new password"
            autoComplete="new-password"
          />
        )}
      </form.Field>
      <div className="flex flex-col items-start gap-2">
        <Button type="submit" isPending={isSubmitting}>
          Update password
        </Button>
        <span className="text-sm text-fg-muted">
          Other devices will be signed out.
        </span>
      </div>
    </form>
  )
}

function SetPasswordForm({ email }: { email: string }) {
  const router = useRouter()

  const form = useForm({
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: setPasswordFormSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await setPassword({ data: { newPassword: value.newPassword } })
      } catch (error) {
        toastManager.add({
          type: 'error',
          description:
            (error instanceof Error && error.message) || 'Failed to set password',
        })

        return
      }

      toastManager.add({ type: 'success', description: 'Password set' })
      await router.invalidate()
    },
  })

  const isSubmitting = useSelector(form.store, state => state.isSubmitting)

  return (
    <form
      className="flex max-w-md flex-col gap-5"
      method="post"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <UsernameField email={email} />
      <form.Field name="newPassword">
        {field => (
          <PasswordField
            field={field}
            label="New password"
            autoComplete="new-password"
            showRequirements
          />
        )}
      </form.Field>
      <form.Field name="confirmPassword">
        {field => (
          <PasswordField
            field={field}
            label="Confirm password"
            autoComplete="new-password"
          />
        )}
      </form.Field>
      <div>
        <Button type="submit" isPending={isSubmitting}>
          Set password
        </Button>
      </div>
    </form>
  )
}

/** Lets password managers file the new password under the right account. */
function UsernameField({ email }: { email: string }) {
  return (
    <input
      type="email"
      name="username"
      autoComplete="username"
      value={email}
      readOnly
      hidden
    />
  )
}

interface PasswordFieldProps {
  field: AnyFieldApi
  label: string
  autoComplete: 'current-password' | 'new-password'
  showRequirements?: boolean
}

function PasswordField({
  field,
  label,
  autoComplete,
  showRequirements,
}: PasswordFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const requirementsId = useId()
  const [isFocused, setIsFocused] = useState(false)
  const isMobile = useIsMobile()
  const password: string = field.state.value
  const isInvalid = !field.state.meta.isValid
  const requirements = { password, isInvalid }

  return (
    <TextField
      name={field.name}
      type="password"
      autoComplete={autoComplete}
      value={password}
      onChange={field.handleChange}
      onBlur={field.handleBlur}
      onFocusChange={setIsFocused}
      isInvalid={isInvalid}
      validationBehavior="aria"
      aria-describedby={showRequirements ? requirementsId : undefined}
    >
      <Label>{label}</Label>
      <Input ref={inputRef} />
      {showRequirements && (
        <>
          <PasswordRequirements
            id={requirementsId}
            className="sr-only"
            {...requirements}
          />
          {isMobile
            ? isFocused && (
              <PasswordRequirements
                aria-hidden
                className="text-sm"
                {...requirements}
              />
            )
            : (
                <Tooltip isOpen={isFocused}>
                  <TooltipContent
                    triggerRef={inputRef}
                    placement="right"
                    aria-hidden
                    className="px-3 py-2.5 text-left"
                  >
                    <PasswordRequirements {...requirements} />
                  </TooltipContent>
                </Tooltip>
              )}
        </>
      )}
      <FieldError>{field.state.meta.errors[0]?.message}</FieldError>
    </TextField>
  )
}

interface PasswordRequirementsProps extends React.ComponentProps<'div'> {
  password: string
  isInvalid: boolean
}

function PasswordRequirements({
  password,
  isInvalid,
  ...props
}: PasswordRequirementsProps) {
  return (
    <div {...props}>
      <p className="mb-1.5 font-medium text-fg">Your password must include:</p>
      <ul className="flex flex-col gap-1">
        {passwordRequirements.map(({ label, test }) => {
          const isMet = test(password)

          return (
            <li
              key={label}
              className={cn(
                'flex items-center gap-1.5 transition-colors',
                isMet
                  ? 'text-fg-success'
                  : isInvalid ? 'text-fg-danger' : 'text-fg-muted'
              )}
            >
              {isMet
                ? <CircleCheckIcon className="size-3.5" />
                : <CircleIcon className="size-3.5" />}
              {label}
              <span className="sr-only">{isMet ? ', met' : ', not met'}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
