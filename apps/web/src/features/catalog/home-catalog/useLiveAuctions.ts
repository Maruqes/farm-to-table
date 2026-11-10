import { useEffect, useState } from 'react'
import { catalogService } from './catalog.service'
import type { LiveAuction } from './catalog.types'

export function useLiveAuctions(limit = 3): LiveAuction[] {
  const [auctions, setAuctions] = useState<LiveAuction[]>([])

  useEffect(() => {
    let active = true
    catalogService
      .listLiveAuctions(limit)
      .then((result) => {
        if (active) setAuctions(result)
      })
      .catch(() => {
        if (active) setAuctions([])
      })
    return () => {
      active = false
    }
  }, [limit])

  return auctions
}
