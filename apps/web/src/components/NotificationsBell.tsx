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
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/services/format'
import { NOTIFICATION_TYPE_LABELS } from '@/features/orders/notifications/notifications.labels'
import type {
  NotificationActionResult,
  NotificationType,
  UserNotification,
} from '@/features/orders/notifications/notifications.types'

type NotificationIcon = ComponentType<{
  size?: number | string
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
    <div ref={wrapperRef} className="notifications-wrap">
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
      >
        <Bell size={20} aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="notifications-count"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div
          id={PANEL_ID}
          ref={panelRef}
          role="dialog"
          aria-label="Notifications"
          tabIndex={-1}
          className="notifications-panel"
        >
          <div className="notifications-panel-head d-flex align-items-start justify-content-between gap-3 flex-shrink-0 px-3 py-3">
            <div className="min-w-0">
              <h2 className="fs-6 mb-0">
                Notifications
              </h2>
              {!loading && !error && (
                <p aria-live="polite" className="small text-body-secondary tabular mb-0">
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
              >
                Mark all as read
              </Button>
            )}
          </div>

          <div className="notifications-list">
            <PageState
              loading={loading}
              error={error}
              errorMessage={error ?? undefined}
              onRetry={onReload}
              empty={showEmpty}
              emptyMessage="No notifications yet. Order updates, auction results and approval news will appear here."
            >
              <ul className="board">
                {notifications.map((notification) => {
                  const Icon = NOTIFICATION_ICONS[notification.type]
                  const textId = `notification-${notification.id}-text`

                  return (
                    <li key={notification.id} className="board-row notifications-row px-3">
                      <Icon
                        size={16}
                        className={notification.read ? 'text-body-secondary flex-shrink-0 mt-1' : 'flex-shrink-0 mt-1'}
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-grow-1">
                        <div className="d-flex align-items-start justify-content-between gap-2">
                          <p
                            id={textId}
                            className={
                              notification.read
                                ? 'small text-body-secondary mb-0'
                                : 'small fw-semibold mb-0'
                            }
                          >
                            {notification.text}
                          </p>
                          {!notification.read && (
                            <span className="notifications-dot">
                              <span className="visually-hidden">Unread</span>
                            </span>
                          )}
                        </div>
                        <div className="d-flex flex-wrap align-items-center gap-2 mt-2">
                          <time
                            dateTime={notification.date ?? undefined}
                            className="small text-body-secondary tabular"
                          >
                            {notification.date
                              ? formatDateTime(notification.date)
                              : 'Just now'}
                          </time>
                          <span className="small text-body-secondary">
                            {NOTIFICATION_TYPE_LABELS[notification.type]}
                          </span>
                          {!notification.read && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="ms-auto"
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
