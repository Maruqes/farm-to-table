import { useState } from 'react'
import { PageState } from '@/components/PageState'
import type { AuctionListStatus } from '../auctions-list.types'
import { useAuctionsList } from '../useAuctionsList'
import { useNow } from '../useNow'
import { AuctionGrid } from './AuctionGrid'
import { AuctionListTabs } from './AuctionListTabs'

const EMPTY_COPY: Record<AuctionListStatus, string> = {
  active:
    'No auctions are live right now. Check the scheduled tab to see which lots open next.',
  scheduled:
    'Nothing is scheduled yet. New lots will appear here once a producer publishes one.',
  ended:
    'No auctions have closed yet. Live lots move here when their clock runs out.',
}

const SUMMARY_NOUN: Record<AuctionListStatus, string> = {
  active: 'live auction',
  scheduled: 'scheduled auction',
  ended: 'ended auction',
}

export function AuctionsListView() {
  const [status, setStatus] = useState<AuctionListStatus>('active')
  const { auctions, loading, error, reload } = useAuctionsList(status)
  const now = useNow()

  const noun = SUMMARY_NOUN[status]
  const summary = loading
    ? 'Loading auctions…'
    : error
      ? 'Auctions are unavailable right now.'
      : `${auctions.length} ${noun}${auctions.length === 1 ? '' : 's'}`

  return (
    <section aria-labelledby="auctions-heading" className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 id="auctions-heading">Auctions</h1>
        <p className="measure text-dim">
          Seasonal lots from local producers, sold to the highest bidder before the
          clock runs out. Watch a room first, then bid when you are ready.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <AuctionListTabs value={status} onChange={setStatus} />
        <p role="status" aria-atomic="true" className="mb-0 text-sm text-dim">
          {summary}
        </p>
      </div>

      <div
        role="tabpanel"
        id={`auctions-panel-${status}`}
        aria-labelledby={`auctions-tab-${status}`}
      >
        <PageState
          loading={loading}
          error={error}
          errorMessage={error ?? undefined}
          empty={!loading && !error && auctions.length === 0}
          emptyMessage={EMPTY_COPY[status]}
          onRetry={reload}
        >
          <AuctionGrid auctions={auctions} now={now} />
        </PageState>
      </div>
    </section>
  )
}
