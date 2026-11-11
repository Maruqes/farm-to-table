import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from 'react'
import { toast } from 'sonner'
import {
  BadgeCheck,
  Bell,
  CircleSlash,
  CircleX,
  EyeOff,
  Package,
  ShoppingBasket,
  Trophy,
} from 'lucide-react'
import { PageState } from '@/components/PageState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/components/ui/utils'
import { formatDateTime } from '@/services/format'
import { NOTIFICATION_TYPE_LABELS } from '@/features/orders/notifications/notifications.labels'
import type {
  NotificationActionResult,
  NotificationType,
  UserNotification,
} from '@/features/orders/notifications/notifications.types'

type NotificationIcon = ComponentType<{
  className?: string
  'aria-hidden'?: boolean | 'true' | 'false'
}>

const NOTIFICATION_ICONS: Record<NotificationType, NotificationIcon> = {
  'order-status-changed': Package,
  'order-new': ShoppingBasket,
  'auction-won': Trophy,
  'auction-skipped': CircleSlash,
  'producer-approved': BadgeCheck,
  'producer-rejected': CircleX,
  'product-hidden': EyeOff,
}

const PANEL_ID = 'notifications-panel'

interface NotificationsBellProps {
  notifications: UserNotification[]
  unreadCount: number
  loading: boolean
  error: string | null
  onReload: () => void
  onMarkRead: (id: string) => Promise<NotificationActionResult>
  onMarkAllRead: () => Promise<NotificationActionResult>
}

export function NotificationsBell({
  notifications,
  unreadCount,
  loading,
  error,
  onReload,
  onMarkRead,
  onMarkAllRead,
}: NotificationsBellProps) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const focusTrigger = useCallback(() => {
    wrapperRef.current
      ?.querySelector<HTMLButtonElement>('[data-notifications-trigger]')
      ?.focus()
  }, [])

  useEffect(() => {
    if (open) panelRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false)
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      setOpen(false)
      focusTrigger()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [focusTrigger, open])

  function focusMarkReadControl(id: string | undefined) {
    const controls = panelRef.current?.querySelectorAll<HTMLButtonElement>('[data-mark-read]')
    const next = id
      ? Array.from(controls ?? []).find((button) => button.dataset.markRead === id)
      : null
    ;(next ?? panelRef.current)?.focus()
  }

  async function handleMarkRead(id: string) {
    const index = notifications.findIndex((notification) => notification.id === id)
    const nextUnreadId = notifications
      .slice(index + 1)
      .find((notification) => !notification.read)
      ?.id

    const pending = onMarkRead(id)
    // The clicked control unmounts as soon as the item becomes read; move focus
    // before that happens so keyboard users never fall back to <body>.
    focusMarkReadControl(nextUnreadId)

    const result = await pending
    if (!result.ok) toast.error(result.message)
  }

  async function handleMarkAllRead() {
    // The button unmounts when the last unread item clears; keep focus in the panel.
    panelRef.current?.focus()
    const result = await onMarkAllRead()
    if (result.ok) toast.success('All notifications marked as read.')
    else toast.error(result.message)
  }

  const triggerLabel =
    unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'
  const showEmpty = !loading && !error && notifications.length === 0

  return (
    <div ref={wrapperRef} className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        data-notifications-trigger
        aria-label={triggerLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={PANEL_ID}
        onClick={() => setOpen((value) => !value)}
        className="relative"
      >
        <Bell className="size-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <Badge
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 min-w-5 justify-center px-1 leading-5 tabular"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {open && (
        <div
          id={PANEL_ID}
          ref={panelRef}
          role="dialog"
          aria-label="Notifications"
          tabIndex={-1}
          className="fixed inset-x-4 bottom-4 z-50 flex max-h-[70dvh] flex-col overflow-hidden rounded-xl border bg-card text-card-foreground md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-full md:mt-2 md:max-h-[28rem] md:w-96"
        >
          <div className="flex shrink-0 items-start justify-between gap-3 border-b px-4 py-3">
            <div className="min-w-0">
              <h2 className="font-display text-base font-extrabold tracking-tight">
                Notifications
              </h2>
              {!loading && !error && (
                <p aria-live="polite" className="text-xs text-muted-foreground tabular">
                  {unreadCount === 0 ? 'No unread notifications' : `${unreadCount} unread`}
                </p>
              )}
            </div>
            {!loading && !error && unreadCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                className="h-10 px-3"
              >
                Mark all as read
              </Button>
            )}
          </div>

          <div className="min-h-0 overflow-y-auto [&>div]:rounded-none [&>div]:border-0 [&>div]:bg-transparent [&>div]:px-6 [&>div]:py-10">
            <PageState
              loading={loading}
              error={error}
              errorMessage={error ?? undefined}
              onRetry={onReload}
              empty={showEmpty}
              emptyMessage="No notifications yet. Order updates, auction results and approval news will appear here."
            >
              <ul className="divide-y divide-border">
                {notifications.map((notification) => {
                  const Icon = NOTIFICATION_ICONS[notification.type]
                  const textId = `notification-${notification.id}-text`

                  return (
                    <li key={notification.id} className="flex items-start gap-3 px-4 py-3">
                      <Icon
                        className={cn(
                          'mt-0.5 size-4 shrink-0',
                          notification.read ? 'text-muted-foreground' : 'text-foreground',
                        )}
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            id={textId}
                            className={cn(
                              'text-sm',
                              notification.read
                                ? 'text-muted-foreground'
                                : 'font-medium text-foreground',
                            )}
                          >
                            {notification.text}
                          </p>
                          {!notification.read && (
                            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary">
                              <span className="sr-only">Unread</span>
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <time
                            dateTime={notification.date ?? undefined}
                            className="text-xs text-muted-foreground tabular"
                          >
                            {notification.date
                              ? formatDateTime(notification.date)
                              : 'Just now'}
                          </time>
                          <span className="text-xs text-muted-foreground">
                            {NOTIFICATION_TYPE_LABELS[notification.type]}
                          </span>
                          {!notification.read && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="ml-auto h-10 px-3 text-xs"
                              onClick={() => handleMarkRead(notification.id)}
                              aria-describedby={textId}
                              data-mark-read={notification.id}
                            >
                              Mark read
                            </Button>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </PageState>
          </div>
        </div>
      )}
    </div>
  )
}
