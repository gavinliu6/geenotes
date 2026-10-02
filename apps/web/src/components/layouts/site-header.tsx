import { Link } from '@tanstack/react-router'

import { Logo } from '@/components/icons'

export function SiteHeader() {
  return (
    <header>
      <div className="
        mx-auto flex w-full max-w-8xl items-center
        max-[1488px]:px-6
      "
      >
        <div className="inline-flex h-16 items-center">
          <Link
            to="/"
            className="
              inline-flex items-center rounded-sm focus-reset
              focus-visible:focus-ring
            "
          >
            <span className="
              text-yellow-500
              dark:text-yellow-400
            "
            >
              <Logo />
            </span>
            <span className="mt-0.5 ml-2 text-[0.9375rem] font-medium">Geenotes</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
