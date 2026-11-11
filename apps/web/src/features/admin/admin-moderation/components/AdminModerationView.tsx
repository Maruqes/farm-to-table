import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { PageState } from '@/components/PageState'
import {
  CONTENT_TYPE_LABELS,
  moderationEmptyMessage,
} from '../admin-moderation.labels'
import type {
  AdminContentItem,
  ContentType,
  ModerationActionResult,
} from '../admin-moderation.types'
import { useAdminModeration } from '../useAdminModeration'
import { ModerationList } from './ModerationList'
import { ModerationTabs } from './ModerationTabs'

export function AdminModerationView() {
  const [type, setType] = useState<ContentType>('product')
  const {
    items,
    summary,
    loading,
    error,
    empty,
    pending,
    announcement,
    reload,
    setItemHidden,
  } = useAdminModeration(type)

  const handleToggle = useCallback(
    async (
      item: AdminContentItem,
      hidden: boolean,
    ): Promise<ModerationActionResult> => {
      const result = await setItemHidden(item, hidden)

      if (result.ok) {
        toast.success(
          hidden
            ? `${item.name} is now hidden from the public catalog.`
            : `${item.name} is visible again.`,
        )
      } else {
        toast.error(result.message)
      }

      return result
    },
    [setItemHidden],
  )

  return (
    <section aria-labelledby="admin-moderation-heading" className="space-y-6">
      <Link
        to="/admin"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to admin overview
      </Link>

      <header className="space-y-1">
        <h1 id="admin-moderation-heading">Content moderation</h1>
        <p className="max-w-[65ch] text-muted-foreground">
          Hide a product or a producer page to remove it from the public
          catalog. Hiding never deletes the content or changes its text, and
          you can unhide it at any time.
        </p>
      </header>

      <ModerationTabs value={type} onChange={setType} />

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      <div
        role="tabpanel"
        id={`moderation-panel-${type}`}
        aria-labelledby={`moderation-tab-${type}`}
        className="space-y-3"
      >
        <PageState
          loading={loading}
          error={error}
          errorMessage={error ?? undefined}
          onRetry={reload}
          empty={empty}
          emptyMessage={moderationEmptyMessage(type)}
        >
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              <data
                value={summary.total}
                className="font-medium text-foreground tabular"
              >
                {summary.total}
              </data>{' '}
              {summary.total === 1 ? 'item' : 'items'}
              <span aria-hidden="true"> · </span>
              <data
                value={summary.hidden}
                className="font-medium text-foreground tabular"
              >
                {summary.hidden}
              </data>{' '}
              hidden
            </p>

            <ModerationList
              items={items}
              pending={pending}
              listLabel={`${CONTENT_TYPE_LABELS[type]} for moderation`}
              onToggle={handleToggle}
            />
          </div>
        </PageState>
      </div>
    </section>
  )
}
