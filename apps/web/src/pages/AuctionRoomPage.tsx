import { Link, useParams } from 'react-router-dom'
import { PageState } from '@/components/PageState'
import { Button } from '@/components/ui/button'
import { getToken } from '@/services/api'
import { AuctionRoomView, useAuction } from '@/features/auctions/auction-room'

export default function AuctionRoomPage() {
  const { id = '' } = useParams<{ id: string }>()
  const token = getToken()
  const {
    auction,
    loading,
    error,
    notFound,
    bidError,
    bidding,
    announcement,
    placeBid,
    clearBidError,
    reload,
  } = useAuction(id, token)

  if (notFound) {
    return (
      <div className="flex flex-col gap-6">
        <PageState
          empty
          emptyMessage="We could not find this auction. It may have ended and been removed."
        />
        <div className="flex justify-center">
          <Button asChild variant="outline">
            <Link to="/auctions">Back to auctions</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <PageState
      loading={loading}
      error={error}
      errorMessage={error ?? undefined}
      onRetry={reload}
    >
      {auction && (
        <AuctionRoomView
          key={auction.id}
          auction={auction}
          bidding={bidding}
          bidError={bidError}
          announcement={announcement}
          onPlaceBid={placeBid}
          onDismissBidError={clearBidError}
        />
      )}
    </PageState>
  )
}
