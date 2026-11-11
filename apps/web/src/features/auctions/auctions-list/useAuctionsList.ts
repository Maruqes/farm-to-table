import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/services/api'
import { auctionsListService } from './auctions-list.service'
import type { AuctionListItem, AuctionListStatus } from './auctions-list.types'

interface AuctionsListResult {
  auctions: AuctionListItem[]
  loading: boolean
  error: string | null
  reload: () => void
}

interface AuctionsListSnapshot {
  key: string
  auctions: AuctionListItem[]
  error: string | null
}

const LOAD_ERROR = 'The auctions could not be loaded. Check your connection and try again.'

export function useAuctionsList(status: AuctionListStatus): AuctionsListResult {
  const [attempt, setAttempt] = useState(0)
  const [snapshot, setSnapshot] = useState<AuctionsListSnapshot>({
    key: '',
    auctions: [],
    error: null,
  })

  const requestKey = `${status}:${attempt}`

  useEffect(() => {
    let active = true

    auctionsListService
      .listAuctions({ status })
      .then((auctions) => {
        if (!active) return
        setSnapshot({ key: `${status}:${attempt}`, auctions, error: null })
      })
      .catch((cause: unknown) => {
        if (!active) return
        setSnapshot({
          key: `${status}:${attempt}`,
          auctions: [],
          error: cause instanceof ApiError ? cause.message : LOAD_ERROR,
        })
      })

    return () => {
      active = false
    }
  }, [status, attempt])

  const reload = useCallback(() => {
    setAttempt((value) => value + 1)
  }, [])

  const current = snapshot.key === requestKey

  return {
    auctions: current ? snapshot.auctions : [],
    loading: !current,
    error: current ? snapshot.error : null,
    reload,
  }
}
