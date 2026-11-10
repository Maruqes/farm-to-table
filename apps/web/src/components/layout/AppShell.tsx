import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Sprout } from 'lucide-react'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'

// Auth pages are focused: logo only, no navigation, search or footer.
const FOCUSED_PATHS = ['/login', '/register']

export function AppShell({ children }: { children: ReactNode }) {
  const focused = FOCUSED_PATHS.includes(useLocation().pathname)

  return (
    <div className="flex min-h-screen flex-col">
      {focused ? (
        <header className="mx-auto w-full max-w-6xl px-4 py-3">
          <Link to="/" className="inline-flex items-center gap-2 rounded-md font-display text-lg font-semibold tracking-tight">
            <Sprout className="size-5 text-primary" aria-hidden="true" />
            Farm to Table
          </Link>
        </header>
      ) : (
        <SiteHeader />
      )}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      {!focused && <SiteFooter />}
    </div>
  )
}
