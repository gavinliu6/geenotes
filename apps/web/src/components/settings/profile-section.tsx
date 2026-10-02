import { revalidateLogic, useForm, useSelector } from '@tanstack/react-form'
import { useRouter } from '@tanstack/react-router'
import { z } from 'zod'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { FieldError, Label } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { TextField } from '@/components/ui/text-field'
import { toastManager } from '@/components/ui/toast'
import { authClient } from '@/lib/auth-client'
import type { AuthUser } from '@/lib/auth-types'
import { getAvatarFallback } from '@/utils/account'
import { userNameSchema } from '@/utils/schemas'

import { SettingsSection } from './settings-section'

const profileSchema = z.object({
  name: userNameSchema,
})

interface ProfileSectionProps {
  user: AuthUser
}

export function ProfileSection({ user }: ProfileSectionProps) {
  const router = useRouter()

  const form = useForm({
    defaultValues: {
      name: user.name,
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: profileSchema,
    },
    onSubmit: async ({ value }) => {
      const { error } = await authClient.updateUser({ name: value.name.trim() })

      if (error) {
        toastManager.add({
          type: 'error',
          description: error.message || 'Failed to update profile',
        })

        return
      }

      await router.invalidate()
      toastManager.add({ type: 'success', description: 'Profile updated' })
    },
  })

  const isSubmitting = useSelector(form.store, state => state.isSubmitting)
  const isChanged = useSelector(
    form.store,
    state => state.values.name.trim() !== user.name
  )

  return (
    <SettingsSection title="Profile">
      <div className="
        flex flex-col-reverse gap-6
        sm:flex-row sm:items-start sm:justify-between
      "
      >
        <form
          className="flex max-w-md flex-1 flex-col gap-5"
          method="post"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void form.handleSubmit()
          }}
        >
          <div className="flex flex-col gap-2 text-sm">
            <span>Email</span>
            <span className="text-fg-muted">{user.email}</span>
          </div>
          <form.Field name="name">
            {field => (
              <TextField
                name={field.name}
                autoComplete="name"
                value={field.state.value}
                onChange={field.handleChange}
                onBlur={field.handleBlur}
                isInvalid={!field.state.meta.isValid}
                validationBehavior="aria"
              >
                <Label>Name</Label>
                <div className="flex gap-2">
                  <Input className="min-w-0 flex-1" />
                  <Button
                    type="submit"
                    isPending={isSubmitting}
                    isDisabled={!isChanged}
                  >
                    Save
                  </Button>
                </div>
                <FieldError>{field.state.meta.errors[0]?.message}</FieldError>
              </TextField>
            )}
          </form.Field>
        </form>
        <div className="flex flex-col gap-2">
          <span className="text-sm">Profile picture</span>
          <Avatar className="size-24 ring-1 ring-border">
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback className="text-3xl">
              {getAvatarFallback(user.name)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-fg-muted">
            {user.image ? 'Synced from GitHub' : 'Can\'t be changed yet'}
          </span>
        </div>
      </div>
    </SettingsSection>
  )
}
