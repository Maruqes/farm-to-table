import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'
import { LiveAuctionsBar } from '@/features/catalog/home-catalog/components/LiveAuctionsStrip'

// Auth pages are focused: logo only, no navigation, search or footer.
const FOCUSED_PATHS = ['/login', '/register']

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const focused = FOCUSED_PATHS.includes(pathname)
  const showAuctions = pathname === '/' // the live auctions bar belongs to the catalog only

  return (
    <div className={showAuctions ? 'flex min-h-screen flex-col pb-5' : 'flex min-h-screen flex-col'}>
      {focused ? (
        <header className="mx-auto w-full max-w-6xl px-4 py-3">
          <Link to="/" className="wordmark">
            Farm to table
          </Link>
        </header>
      ) : (
        <SiteHeader />
      )}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4">{children}</main>
      {!focused && <SiteFooter />}
      {showAuctions && <LiveAuctionsBar />}
    </div>
  )
}
