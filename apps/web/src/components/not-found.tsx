import {
  Link,
  useHydrated,
  useRouter,
  useRouterState
} from '@tanstack/react-router'

import { SiteHeader } from '@/components/layouts/site-header'
import { Button, buttonStyles } from '@/components/ui/button'

export function NotFoundPage() {
  const router = useRouter()
  const canGoBack = useRouterState({
    select: state => (state.resolvedLocation?.state.__TSR_index ?? 0) !== 0,
  })
  const isHydrated = useHydrated()

  return (
    <div className="min-h-svh">
      <SiteHeader />
      <main>
        <article className="
          mx-auto w-full max-w-2xl px-6 pt-8 pb-16
          md:pt-16
        "
        >
          <h1 className="border-b pb-3 text-[2rem]/10 tracking-tight">
            404
          </h1>
          <div className="markdown-body mt-4">
            <p>Whoops, the page you're looking for doesn't exist.</p>
            <p>It may have been moved or deleted. Or maybe it was never written in the first place.</p>
            <img
              className="h-auto w-full outline-none"
              src="/404.png"
              width={1200}
              height={600}
              alt=""
              decoding="async"
            />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              to="/"
              className={buttonStyles({
                variant: 'inverse',
                size: 'lg',
                className: 'px-4',
              })}
            >
              Return to homepage
            </Link>
            {isHydrated && canGoBack && (
              <Button
                variant="outline"
                size="lg"
                className="px-4"
                onPress={() => router.history.back()}
              >
                Return to previous page
              </Button>
            )}
          </div>
        </article>
      </main>
    </div>
  )
}
