import { Link, NavLink } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { Notifications } from '@/components/Notifications'
import { useSession, type Role } from '@/context/session'
import { ROLE_LABELS } from '@/context/roles'
import { Button } from '@/components/ui/button'
import { cn } from '@/components/ui/utils'
import { SearchBox } from './SearchBox'
import { DevRoleSwitcher } from './DevRoleSwitcher'
import { USE_MOCKS } from '@/services/env'
import { useLiveAuctionCount } from '@/features/auctions/auctions-list'

interface NavItem {
  to: string
  label: string
}

const PUBLIC_LINKS: NavItem[] = [
  { to: '/', label: 'Home' },
  { to: '/producers', label: 'Producers' },
  { to: '/auctions', label: 'Auctions' },
]

const ROLE_LINKS: Record<Role, NavItem[]> = {
  visitor: [],
  buyer: [
    { to: '/cart', label: 'Cart' },
    { to: '/orders', label: 'Orders' },
  ],
  producer: [
    { to: '/producer', label: 'Dashboard' },
    { to: '/producer/products', label: 'Products' },
    { to: '/producer/orders', label: 'Orders' },
    { to: '/producer/auctions', label: 'Auctions' },
  ],
  admin: [{ to: '/admin', label: 'Admin' }],
}

function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn('site-nav-link', isActive && 'active')
}

export function SiteHeader() {
  const { user, role, isAuthenticated, logout } = useSession()
  const liveAuctionCount = useLiveAuctionCount()
  const links = [...PUBLIC_LINKS, ...ROLE_LINKS[role], ...(isAuthenticated ? [{ to: '/account', label: 'Account' }] : [])]

  return (
    <header className="site-header sticky-top">
      <div className="container">
        <div className="d-flex flex-wrap align-items-center gap-3 py-3">
          <Link to="/" className="wordmark">
            Farm to table
          </Link>

          <div className="site-search">
            <SearchBox />
          </div>

          <div className="ms-auto d-flex align-items-center gap-2">
            <ThemeToggle />
            <Notifications />
            {isAuthenticated && user ? (
              <>
                <span className="d-none d-md-inline small text-body-secondary">
                  {user.name} · {ROLE_LABELS[role]}
                </span>
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut size={16} aria-hidden="true" />
                  Log out
                </Button>
              </>
            ) : (
              <Button size="sm" asChild>
                <Link to="/login">Log in</Link>
              </Button>
            )}
          </div>
        </div>

        <nav aria-label="Main navigation" className="d-flex gap-1 overflow-x-auto">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/' || link.to === '/producer'}
              className={navLinkClass}
              aria-label={
                link.to === '/auctions' && liveAuctionCount > 0
                  ? `Auctions, ${liveAuctionCount} live`
                  : undefined
              }
            >
              {link.label}
              {link.to === '/auctions' && liveAuctionCount > 0 && (
                <span aria-hidden="true" className="live-count">
                  {liveAuctionCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {import.meta.env.DEV && USE_MOCKS && <DevRoleSwitcher />}
    </header>
  )
}
