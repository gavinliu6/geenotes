import { useRouter } from '@tanstack/react-router'
import { useRef, useState } from 'react'

import {
  focusFirstDigit,
  TOTP_LENGTH,
  TotpCodeField
} from '@/components/totp-code-field'
import { Button } from '@/components/ui/button'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Modal } from '@/components/ui/modal'
import { QRCode } from '@/components/ui/qr-code'
import { authClient } from '@/lib/auth-client'

import { CopyButton } from './copy-button'
import { PasswordStep } from './password-step'
import { RecoveryCodesStep } from './recovery-codes-step'

interface TotpSetup {
  totpURI: string
  backupCodes: string[]
}

interface TwoFactorSetupDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export function TwoFactorSetupDialog({
  isOpen,
  onOpenChange,
}: TwoFactorSetupDialogProps) {
  const router = useRouter()
  const [setup, setSetup] = useState<TotpSetup>()
  const [isVerified, setIsVerified] = useState(false)

  const enable = async (password: string) => {
    const { data, error } = await authClient.twoFactor.enable({ password })

    if (error) return error.message || 'An error occurred'
    if (data.method !== 'totp') return 'An error occurred'

    setSetup({ totpURI: data.totpURI, backupCodes: data.backupCodes })
  }

  const verify = async (code: string) => {
    const { error } = await authClient.twoFactor.verifyTotp({ code })

    if (error) return error.message || 'An error occurred'

    setIsVerified(true)
    void router.invalidate()
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable={!isVerified}
      isKeyboardDismissDisabled={isVerified}
      className="sm:max-w-md"
    >
      <DialogContent>
        {!setup
          ? (
              <PasswordStep
                title="Enable two-factor authentication"
                description="Confirm your password to continue."
                submitLabel="Continue"
                onSubmit={enable}
              />
            )
          : !isVerified
              ? <ScanStep totpURI={setup.totpURI} onVerify={verify} />
              : (
                  <RecoveryCodesStep
                    title="Save your recovery codes"
                    description="Two-factor authentication is on. If you lose access to your authenticator app, each of these codes signs you in once. Copy or download them and keep them somewhere safe, like a password manager."
                    codes={setup.backupCodes}
                  />
                )}
      </DialogContent>
    </Modal>
  )
}

interface ScanStepProps {
  totpURI: string
  /** Resolves to an error message when the code is rejected. */
  onVerify: (code: string) => Promise<string | undefined>
}

function ScanStep({ totpURI, onVerify }: ScanStepProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string>()
  const [isPending, setIsPending] = useState(false)
  const isVerifyingRef = useRef(false)
  const codeFieldRef = useRef<HTMLDivElement>(null)
  const secret = new URL(totpURI).searchParams.get('secret') ?? ''

  const verify = async (value: string) => {
    if (isVerifyingRef.current) return

    if (value.length < TOTP_LENGTH) {
      setError(`Enter the ${TOTP_LENGTH}-digit code`)

      return
    }

    isVerifyingRef.current = true
    setIsPending(true)

    try {
      const message = await onVerify(value)

      if (message) {
        setError(message)
        setCode('')
        focusFirstDigit(codeFieldRef.current)
      }
    } finally {
      isVerifyingRef.current = false
      setIsPending(false)
    }
  }

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        void verify(code)
      }}
    >
      <DialogHeader>
        <DialogTitle>Scan the QR code</DialogTitle>
        <DialogDescription>
          Use an authenticator app such as 1Password, Google Authenticator or
          Microsoft Authenticator.
        </DialogDescription>
      </DialogHeader>
      <QRCode
        value={totpURI}
        aria-label="QR code for your authenticator app"
        className="
          size-36 self-center rounded-lg border bg-white p-2.5 text-black
        "
      />
      <div className="flex flex-col gap-2">
        <p className="text-pretty text-fg-muted">
          Can't scan it? Enter this setup key in the app instead.
        </p>
        <div className="
          flex items-center gap-2 rounded-lg border bg-muted/50 py-2 pr-2 pl-3
        "
        >
          <code className="
            min-w-0 flex-1 font-mono text-[0.8125rem] text-balance
          "
          >
            {secret.match(/.{1,4}/g)?.join(' ')}
          </code>
          <CopyButton
            value={secret}
            variant="quiet"
            size="sm"
            isIconOnly
            aria-label="Copy setup key"
          />
        </div>
      </div>
      <TotpCodeField
        ref={codeFieldRef}
        label="Verification code"
        description={`Enter the ${TOTP_LENGTH}-digit code shown in the app.`}
        value={code}
        onChange={(value) => {
          setCode(value)
          setError(undefined)
        }}
        onValueComplete={value => void verify(value)}
        error={error}
        autoFocus
      />
      <DialogFooter>
        <Button slot="close">Cancel</Button>
        <Button type="submit" variant="inverse" isPending={isPending}>
          Verify
        </Button>
      </DialogFooter>
    </form>
  )
}
