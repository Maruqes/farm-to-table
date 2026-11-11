import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useSession } from '@/context/session'
import { USE_MOCKS } from '@/services/env'
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
  const { user, updateUser } = useSession()

  // The newest approval/rejection notification is the producer's current status,
  // so an approved producer does not have to log in again to reach the dashboard.
  const decision = notifications.find(
    (item) => item.type === 'producer-approved' || item.type === 'producer-rejected',
  )
  const decided = decision ? (decision.type === 'producer-approved' ? 'approved' : 'rejected') : null
  useEffect(() => {
    // Mock notifications are random samples, not this account's real status.
    if (!USE_MOCKS && decided && user?.role === 'producer' && user.producerStatus !== decided) {
      updateUser({ producerStatus: decided })
    }
  }, [decided, user, updateUser])

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
