import { useEffect, useState } from 'react'
import { auctionsListService } from './auctions-list.service'

// Small, failure-tolerant count for the Auctions nav badge; never blocks navigation.
export function useLiveAuctionCount(): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let active = true

    auctionsListService
      .listAuctions({ status: 'active' })
      .then((auctions) => {
        if (active) setCount(auctions.length)
      })
      .catch(() => {
        if (active) setCount(0)
      })

    return () => {
      active = false
    }
  }, [])

  return count
}
