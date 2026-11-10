import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useSession } from '@/context/session'
import { NOTIFICATION_TYPE_LABELS } from '@/features/orders/notifications/notifications.labels'
import { useNotifications } from '@/features/orders/notifications/useNotifications'
import { NotificationsBell } from '@/components/NotificationsBell'

export function Notifications() {
  const { user, role, isAuthenticated } = useSession()
  const canReceive = isAuthenticated && (role === 'buyer' || role === 'producer')

  if (!canReceive) return null
  return <NotificationsLive key={user?.id} />
}

function NotificationsLive() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    latest,
    reload,
    markRead,
    markAllRead,
  } = useNotifications()
  const toastedRef = useRef(new Set<string>())

  useEffect(() => {
    if (!latest || toastedRef.current.has(latest.id)) return
    toastedRef.current.add(latest.id)
    toast(latest.text, { description: NOTIFICATION_TYPE_LABELS[latest.type] })
  }, [latest])

  return (
    <NotificationsBell
      notifications={notifications}
      unreadCount={unreadCount}
      loading={loading}
      error={error}
      onReload={reload}
      onMarkRead={markRead}
      onMarkAllRead={markAllRead}
    />
  )
}
