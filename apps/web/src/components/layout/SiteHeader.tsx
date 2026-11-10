import { Link, NavLink } from 'react-router-dom'
import { LogOut, Sprout } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { Notifications } from '@/components/Notifications'
import { useSession, type Role } from '@/context/session'
import { ROLE_LABELS } from '@/context/roles'
import { Button } from '@/components/ui/button'
import { cn } from '@/components/ui/utils'
import { SearchBox } from './SearchBox'
import { DevRoleSwitcher } from './DevRoleSwitcher'

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
  return cn(
    'relative inline-flex min-h-10 items-center px-3 text-sm font-medium transition-colors after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:transition-colors',
    isActive ? 'text-foreground after:bg-primary' : 'text-muted-foreground after:bg-transparent hover:text-foreground',
  )
}

export function SiteHeader() {
  const { user, role, isAuthenticated, logout } = useSession()
  const links = [...PUBLIC_LINKS, ...ROLE_LINKS[role], ...(isAuthenticated ? [{ to: '/account', label: 'Account' }] : [])]

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap items-center gap-3 py-3">
          <Link to="/" className="flex items-center gap-2.5 rounded-md font-display text-xl font-extrabold tracking-tight">
            <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
              <Sprout className="size-4.5" aria-hidden="true" />
            </span>
            Farm to Table
          </Link>

          <div className="order-3 min-w-0 basis-full sm:order-none sm:flex-1 sm:basis-auto sm:px-4">
            <SearchBox />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Notifications />
            {isAuthenticated && user ? (
              <>
                <span className="hidden text-sm text-muted-foreground md:inline">
                  {user.name} · {ROLE_LABELS[role]}
                </span>
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="size-4" aria-hidden="true" />
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

        <nav aria-label="Main navigation" className="-mx-3 -mb-px flex gap-1 overflow-x-auto">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'} className={navLinkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {import.meta.env.DEV && <DevRoleSwitcher />}
    </header>
  )
}
