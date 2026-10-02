import { useRouter } from '@tanstack/react-router'
import { KeyRoundIcon, SmartphoneIcon } from 'lucide-react'
import type * as React from 'react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DialogContent } from '@/components/ui/dialog'
import { Modal } from '@/components/ui/modal'
import { toastManager } from '@/components/ui/toast'
import { authClient } from '@/lib/auth-client'

import { PasswordStep } from './password-step'
import { RecoveryCodesStep } from './recovery-codes-step'
import { SettingsSection } from './settings-section'
import { TwoFactorSetupDialog } from './two-factor-setup-dialog'

type TwoFactorDialog = 'setup' | 'regenerate' | 'disable'

interface TwoFactorSectionProps {
  isEnabled: boolean
  hasPassword: boolean
}

export function TwoFactorSection({
  isEnabled,
  hasPassword,
}: TwoFactorSectionProps) {
  const [openDialog, setOpenDialog] = useState<TwoFactorDialog>()
  const [openCount, setOpenCount] = useState(0)

  const show = (dialog: TwoFactorDialog) => {
    setOpenDialog(dialog)
    setOpenCount(count => count + 1)
  }

  const onOpenChange = (isOpen: boolean) => {
    if (!isOpen) setOpenDialog(undefined)
  }

  return (
    <SettingsSection
      title="Two-factor authentication"
      badge={isEnabled
        ? <Badge variant="success">Enabled</Badge>
        : <Badge>Disabled</Badge>}
      action={isEnabled && (
        <Button
          size="sm"
          className="text-fg-danger"
          onPress={() => show('disable')}
        >
          Disable
        </Button>
      )}
    >
      {isEnabled
        ? (
            <>
              <p className="text-sm text-fg-muted">
                Signing in with your email and password also asks for a code
                from your authenticator app.
              </p>
              <ul className="divide-y rounded-lg border">
                <MethodItem
                  icon={<SmartphoneIcon />}
                  title="Authenticator app"
                  description="Generates the codes you enter when signing in."
                  action={<Badge>Configured</Badge>}
                />
                <MethodItem
                  icon={<KeyRoundIcon />}
                  title="Recovery codes"
                  description="Sign in with one of these if you lose access to your app."
                  action={(
                    <Button size="sm" onPress={() => show('regenerate')}>
                      Regenerate
                    </Button>
                  )}
                />
              </ul>
            </>
          )
        : (
            <>
              <p className="text-sm text-fg-muted">
                Add a second step to email and password sign-in with a one-time
                code from an authenticator app. Signing in with GitHub is
                protected by your GitHub account instead.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="inverse"
                  isDisabled={!hasPassword}
                  onPress={() => show('setup')}
                >
                  Enable two-factor authentication
                </Button>
                {!hasPassword && (
                  <span className="text-sm text-fg-muted">
                    Set a password first.
                  </span>
                )}
              </div>
            </>
          )}
      <TwoFactorSetupDialog
        key={`setup-${openCount}`}
        isOpen={openDialog === 'setup'}
        onOpenChange={onOpenChange}
      />
      <RegenerateCodesDialog
        key={`regenerate-${openCount}`}
        isOpen={openDialog === 'regenerate'}
        onOpenChange={onOpenChange}
      />
      <DisableTwoFactorDialog
        isOpen={openDialog === 'disable'}
        onOpenChange={onOpenChange}
      />
    </SettingsSection>
  )
}

interface MethodItemProps {
  icon: React.ReactNode
  title: string
  description: string
  action: React.ReactNode
}

function MethodItem({ icon, title, description, action }: MethodItemProps) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className="
        text-fg-muted
        *:size-4
      "
      >
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-sm text-fg-muted">{description}</span>
      </div>
      {action}
    </li>
  )
}

interface DialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

function RegenerateCodesDialog({ isOpen, onOpenChange }: DialogProps) {
  const [codes, setCodes] = useState<string[]>()

  const regenerate = async (password: string) => {
    const { data, error } = await authClient.twoFactor.generateBackupCodes({
      password,
    })

    if (error) return error.message || 'An error occurred'

    setCodes(data.backupCodes)
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable={!codes}
      isKeyboardDismissDisabled={!!codes}
    >
      <DialogContent>
        {codes
          ? (
              <RecoveryCodesStep
                title="Save your new recovery codes"
                description="Your old codes no longer work. Each of these signs you in once if you lose access to your authenticator app, so keep them somewhere safe."
                codes={codes}
              />
            )
          : (
              <PasswordStep
                title="Regenerate recovery codes"
                description="Your current recovery codes will stop working. Enter your password to continue."
                submitLabel="Regenerate"
                onSubmit={regenerate}
              />
            )}
      </DialogContent>
    </Modal>
  )
}

function DisableTwoFactorDialog({ isOpen, onOpenChange }: DialogProps) {
  const router = useRouter()

  const disable = async (password: string) => {
    const { error } = await authClient.twoFactor.disable({ password })

    if (error) return error.message || 'An error occurred'

    onOpenChange(false)
    toastManager.add({
      type: 'success',
      description: 'Two-factor authentication disabled',
    })
    await router.invalidate()
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <PasswordStep
          title="Disable two-factor authentication?"
          description="Signing in with your email and password will no longer ask for a code, and your recovery codes will stop working."
          submitLabel="Disable"
          submitVariant="danger"
          onSubmit={disable}
        />
      </DialogContent>
    </Modal>
  )
}
