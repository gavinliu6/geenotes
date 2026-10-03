import { revalidateLogic, useForm, useSelector } from '@tanstack/react-form'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import { z } from 'zod'

import { SiteHeader } from '@/components/layouts/site-header'
import {
  focusFirstDigit,
  TOTP_LENGTH,
  TotpCodeField
} from '@/components/totp-code-field'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Description, FieldError, Label } from '@/components/ui/field'
import { Input, InputGroup, InputGroupAddon } from '@/components/ui/input'
import { Link } from '@/components/ui/link'
import { Loader } from '@/components/ui/loader'
import { Marker, MarkerContent } from '@/components/ui/marker'
import { TextField } from '@/components/ui/text-field'
import { toastManager } from '@/components/ui/toast'
import { getSession } from '@/lib/auth.functions'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

const searchSchema = z.object({
  // Only accept same-origin paths so a crafted link can't bounce a signed-in
  // user off to another site.
  returnTo: z
    .string()
    .refine(value => value.startsWith('/') && !value.startsWith('//'))
    .optional()
    .catch(undefined),
})

export const Route = createFileRoute('/login')({
  head: () => ({
    meta: [
      {
        title: 'Sign in | Geenotes',
      },
    ],
  }),
  validateSearch: searchSchema,
  beforeLoad: async () => {
    const session = await getSession()

    if (session) {
      throw redirect({
        to: '/home',
      })
    }
  },
  component: LoginPage,
})

type SocialProvider = 'github'

/* -------------------------------------------------------------------------- */

const credentialsSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .pipe(z.email('Email is invalid')),
  password: z.string().min(1, 'Password is required'),
})

interface TwoFactorChallenge {
  twoFactorRedirect: true
  twoFactorMethods?: string[]
}

/** The two-factor plugin swaps the sign-in response for a challenge, which Better Auth's types don't reflect. */
function isTwoFactorChallenge(data: object): data is TwoFactorChallenge {
  return 'twoFactorRedirect' in data && data.twoFactorRedirect === true
}

function CredentialsSignInForm({
  isDisabled,
  onPendingChange,
  onTwoFactorRequired,
}: {
  isDisabled?: boolean
  /** Lets the parent block other sign-in methods while this one is in flight. */
  onPendingChange?: (isPending: boolean) => void
  onTwoFactorRequired: (methods: string[]) => void
}) {
  const [showPassword, setShowPassword] = useState(false)

  const navigate = useNavigate()
  const { returnTo } = Route.useSearch()

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    // Stay quiet until the first submit, then re-check on every change so
    // errors clear as soon as they're fixed.
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: credentialsSchema,
    },
    onSubmit: async ({ value }) => {
      onPendingChange?.(true)

      try {
        const { data, error } = await authClient.signIn.email({
          email: value.email,
          password: value.password,
        })

        if (error) {
          toastManager.add({
            type: 'error',
            description: error.message || 'An error occurred',
          })

          return
        }

        if (isTwoFactorChallenge(data)) {
          onTwoFactorRequired(data.twoFactorMethods ?? [])

          return
        }

        await navigate({ href: returnTo ?? '/home' })
      } finally {
        onPendingChange?.(false)
      }
    },
  })

  const isSubmitting = useSelector(form.store, state => state.isSubmitting)

  return (
    <form
      className="flex flex-col gap-5"
      method="post"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <form.Field name="email">
        {field => (
          <TextField
            name={field.name}
            type="email"
            autoComplete="email"
            value={field.state.value}
            onChange={field.handleChange}
            onBlur={field.handleBlur}
            isInvalid={!field.state.meta.isValid}
            isDisabled={isDisabled}
            validationBehavior="aria"
          >
            <Label>Email</Label>
            <Input size="lg" />
            <FieldError>{field.state.meta.errors[0]?.message}</FieldError>
          </TextField>
        )}
      </form.Field>
      <form.Field name="password">
        {field => (
          <TextField
            name={field.name}
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={field.state.value}
            onChange={field.handleChange}
            onBlur={field.handleBlur}
            isInvalid={!field.state.meta.isValid}
            isDisabled={isDisabled}
            validationBehavior="aria"
          >
            <Label>Password</Label>
            <InputGroup size="lg">
              <Input />
              <InputGroupAddon>
                <Button
                  variant="quiet"
                  size="sm"
                  isIconOnly
                  isDisabled={isDisabled}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onPress={() => setShowPassword(value => !value)}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </Button>
              </InputGroupAddon>
            </InputGroup>
            <FieldError>{field.state.meta.errors[0]?.message}</FieldError>
          </TextField>
        )}
      </form.Field>
      <Button
        className="h-10 w-full"
        type="submit"
        variant="inverse"
        size="lg"
        isPending={isSubmitting}
        isDisabled={isDisabled}
      >
        Sign in
      </Button>
    </form>
  )
}

/* -------------------------------------------------------------------------- */

type TwoFactorMethod = 'totp' | 'recovery-code'

/** Recovery codes are stored as `xxxxx-xxxxx` and matched exactly, so typing the dash is optional. */
function normalizeRecoveryCode(value: string) {
  const code = value.replace(/\s/g, '')

  return /^[a-z0-9]{10}$/i.test(code)
    ? `${code.slice(0, 5)}-${code.slice(5)}`
    : code
}

function TwoFactorSignInForm({
  methods,
  onCancel,
}: {
  methods: string[]
  onCancel: () => void
}) {
  const hasTotp = methods.includes('totp')
  const [method, setMethod] = useState<TwoFactorMethod>(
    hasTotp ? 'totp' : 'recovery-code'
  )
  const [code, setCode] = useState('')
  const [trustDevice, setTrustDevice] = useState(false)
  const [error, setError] = useState<string>()
  const [isPending, setIsPending] = useState(false)
  const isVerifyingRef = useRef(false)
  const codeFieldRef = useRef<HTMLDivElement>(null)

  const navigate = useNavigate()
  const { returnTo } = Route.useSearch()

  const changeCode = (value: string) => {
    setCode(value)
    setError(undefined)
  }

  const switchMethod = () => {
    setMethod(method === 'totp' ? 'recovery-code' : 'totp')
    changeCode('')
  }

  const verify = async (value: string) => {
    if (isVerifyingRef.current) return

    const recoveryCode = normalizeRecoveryCode(value)

    if (method === 'totp' && value.length < TOTP_LENGTH) {
      setError(`Enter the ${TOTP_LENGTH}-digit code`)

      return
    }

    if (method === 'recovery-code' && !recoveryCode) {
      setError('Enter a recovery code')

      return
    }

    isVerifyingRef.current = true
    setIsPending(true)

    try {
      const { error: verifyError } = method === 'totp'
        ? await authClient.twoFactor.verifyTotp({ code: value, trustDevice })
        : await authClient.twoFactor.verifyBackupCode({
            code: recoveryCode,
            trustDevice,
          })

      if (!verifyError) {
        await navigate({ href: returnTo ?? '/home' })

        return
      }

      if (verifyError.code === 'INVALID_TWO_FACTOR_COOKIE') {
        toastManager.add({
          type: 'error',
          description: 'This sign-in attempt has expired. Please sign in again.',
        })
        onCancel()

        return
      }

      if (verifyError.code === 'TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE') {
        toastManager.add({
          type: 'error',
          description: 'Too many incorrect codes. Please sign in again.',
        })
        onCancel()

        return
      }

      setError(verifyError.message || 'An error occurred')

      if (method === 'totp') {
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
      className="flex flex-col gap-5"
      method="post"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void verify(code)
      }}
    >
      {method === 'totp'
        ? (
            <TotpCodeField
              ref={codeFieldRef}
              label="Authentication code"
              description="Open your authenticator app to view your code."
              value={code}
              onChange={changeCode}
              onValueComplete={value => void verify(value)}
              error={error}
              autoFocus
            />
          )
        : (
            <TextField
              name="code"
              autoComplete="off"
              autoFocus
              value={code}
              onChange={changeCode}
              isInvalid={!!error}
              validationBehavior="aria"
            >
              <Label>Recovery code</Label>
              <Input
                size="lg"
                className="font-mono"
                placeholder="xxxxx-xxxxx"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
              <Description>Each recovery code can only be used once.</Description>
              <FieldError>{error}</FieldError>
            </TextField>
          )}
      <Checkbox isSelected={trustDevice} onChange={setTrustDevice}>
        Trust this device for 30 days
      </Checkbox>
      <Button
        className="h-10 w-full"
        type="submit"
        variant="inverse"
        size="lg"
        isPending={isPending}
      >
        Verify
      </Button>
      <div className="flex flex-wrap justify-center gap-x-4">
        {hasTotp && (
          <Button
            variant="link"
            size="sm"
            className="text-fg-muted"
            onPress={switchMethod}
          >
            {method === 'totp' ? 'Use a recovery code' : 'Use your authenticator app'}
          </Button>
        )}
        <Button
          variant="link"
          size="sm"
          className="text-fg-muted"
          onPress={onCancel}
        >
          Back to sign in
        </Button>
      </div>
    </form>
  )
}

/* -------------------------------------------------------------------------- */

function HeroImage({
  className,
  src,
  srcSet,
}: {
  className: string
  src: string
  srcSet: string
}) {
  return (
    <img
      className={cn(
        `
          h-auto w-full rounded-2xl bg-muted outline -outline-offset-1
          outline-black/5
          dark:outline-white/10
        `,
        className
      )}
      src={src}
      srcSet={srcSet}
      sizes="(min-width: 80rem) 36rem, (min-width: 28rem) 25rem, calc(100vw - 3rem)"
      width={1200}
      height={1500}
      alt=""
      loading="lazy"
      decoding="async"
    />
  )
}

function LoginPage() {
  const [activeProvider, setActiveProvider] = useState<SocialProvider | null>(null)
  const [isCredentialsPending, setIsCredentialsPending] = useState(false)
  const [twoFactorMethods, setTwoFactorMethods] = useState<string[] | null>(null)

  const { returnTo } = Route.useSearch()

  const login = async (provider: SocialProvider) => {
    setActiveProvider(provider)

    const data = await authClient.signIn.social({
      provider: provider,
      callbackURL: returnTo ?? '/home',
    })

    if (data.error) {
      toastManager.add({
        type: 'error',
        description: data.error.message || 'An error occurred',
      })

      setActiveProvider(null)
    }
  }

  return (
    <div className="min-h-svh">
      <SiteHeader />
      <main>
        <div className="mx-auto w-full max-w-8xl">
          <div className="
            grid min-h-[calc(100svh-4rem)] min-w-80 grid-cols-[minmax(0,448px)]
            gap-4
            max-xl:grid-rows-[min-content_min-content_min-content]
            max-xl:content-between max-xl:items-center max-xl:justify-center
            max-xl:pt-16 max-xl:pb-6
            xl:grid-cols-2
          "
          >
            <section className="
              flex items-center justify-center
              max-xl:row-start-2
            "
            >
              <div className="mx-auto flex w-full max-w-lg flex-col px-6 py-12">
                <div className="mb-8 flex flex-col gap-3">
                  <h1 className="
                    text-center font-serif text-4xl font-light tracking-tight
                  "
                  >
                    Sign in to your account
                  </h1>
                  <p className="
                    relative mx-auto w-fit font-serif text-xl font-light
                    text-balance
                    after:absolute after:inset-x-[-0.12em] after:top-[68%]
                    after:bottom-0 after:-z-1 after:bg-linear-to-r
                    after:from-yellow-300/45 after:to-transparent
                    dark:after:from-yellow-400/25
                  "
                  >
                    Capture ideas, organize life
                  </p>
                </div>
                {twoFactorMethods
                  ? (
                      <TwoFactorSignInForm
                        methods={twoFactorMethods}
                        onCancel={() => setTwoFactorMethods(null)}
                      />
                    )
                  : (
                      <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-3">
                          <Button
                            className="h-10 w-full gap-2"
                            variant="outline"
                            size="lg"
                            onClick={() => login('github')}
                            isDisabled={!!activeProvider || isCredentialsPending}
                          >
                            {activeProvider === 'github'
                              ? <><Loader aria-label="Loading" /> Continuing with GitHub</>
                              : (
                                  <>
                                    <svg
                                      className="size-5"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        d="M12 1.95068C17.525 1.95068 22 6.42568 22 11.9507C21.9995 14.0459 21.3419 16.0883 20.1198 17.7902C18.8977 19.4922 17.1727 20.768 15.1875 21.4382C14.6875 21.5382 14.5 21.2257 14.5 20.9632C14.5 20.6257 14.5125 19.5507 14.5125 18.2132C14.5125 17.2757 14.2 16.6757 13.8375 16.3632C16.0625 16.1132 18.4 15.2632 18.4 11.4257C18.4 10.3257 18.0125 9.43818 17.375 8.73818C17.475 8.48818 17.825 7.46318 17.275 6.08818C17.275 6.08818 16.4375 5.81318 14.525 7.11318C13.725 6.88818 12.875 6.77568 12.025 6.77568C11.175 6.77568 10.325 6.88818 9.525 7.11318C7.6125 5.82568 6.775 6.08818 6.775 6.08818C6.225 7.46318 6.575 8.48818 6.675 8.73818C6.0375 9.43818 5.65 10.3382 5.65 11.4257C5.65 15.2507 7.975 16.1132 10.2 16.3632C9.9125 16.6132 9.65 17.0507 9.5625 17.7007C8.9875 17.9632 7.55 18.3882 6.65 16.8757C6.4625 16.5757 5.9 15.8382 5.1125 15.8507C4.275 15.8632 4.775 16.3257 5.125 16.5132C5.55 16.7507 6.0375 17.6382 6.15 17.9257C6.35 18.4882 7 19.5632 9.5125 19.1007C9.5125 19.9382 9.525 20.7257 9.525 20.9632C9.525 21.2257 9.3375 21.5257 8.8375 21.4382C6.8458 20.7752 5.11342 19.502 3.88611 17.799C2.65881 16.096 1.9989 14.0498 2 11.9507C2 6.42568 6.475 1.95068 12 1.95068Z"
                                        fill="currentColor"
                                      />
                                    </svg> Continue with GitHub
                                  </>
                                )}
                          </Button>
                        </div>
                        <Marker variant="separator">
                          <MarkerContent>or</MarkerContent>
                        </Marker>
                        <CredentialsSignInForm
                          isDisabled={!!activeProvider}
                          onPendingChange={setIsCredentialsPending}
                          onTwoFactorRequired={setTwoFactorMethods}
                        />
                      </div>
                    )}
                {!twoFactorMethods && (
                  <div className="mx-auto mt-6">
                    <Link
                      variant="unstyled"
                      className="
                        text-sm text-fg-muted underline underline-offset-3
                        transition-colors
                        hover:text-fg
                      "
                      href="/notes/01m404sj2w252q645hd5wpq99t"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Why can't I sign up?
                    </Link>
                  </div>
                )}
              </div>
            </section>
            <section className="
              flex items-center justify-center
              max-xl:row-start-3 max-xl:p-6
              xl:-ml-12 xl:pr-[calc(50%-14.5rem)]
            "
            >
              <div className="
                mx-auto w-full max-w-xl
                xl:mr-0 xl:max-w-[clamp(18rem,(100svh-10rem)*4/5,36rem)]
              "
              >
                <HeroImage
                  className="dark:hidden"
                  src="/login-hero.webp"
                  srcSet="/login-hero-1x.webp 600w, /login-hero.webp 1200w"
                />
                <HeroImage
                  className="
                    hidden
                    dark:block
                  "
                  src="/login-hero-dark.webp"
                  srcSet="/login-hero-dark-1x.webp 600w, /login-hero-dark.webp 1200w"
                />
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
