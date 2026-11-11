import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from '@/context/session'
import { ApiError } from '@/services/api'
import { formatMoney } from '@/services/format'
import {
  adaptAuctionEnded,
  adaptAuctionRoom,
  adaptBid,
  adaptBidPlaced,
  adaptBidRejected,
  adaptViewers,
} from './auction-room.adapter'
import { createAuctionRoomRealtime } from './auction-room.realtime'
import { auctionRoomService } from './auction-room.service'
import type {
  AuctionRoom,
  BidPlacedUpdate,
  PlaceBidResult,
} from './auction-room.types'

const LOAD_ERROR = 'This auction room could not be loaded. Check your connection and try again.'
const BID_ERROR = 'Your bid could not be placed. Check your connection and try again.'

function roundMoney(value: number): number {
  return Math.round(Math.max(0, value) * 100) / 100
}

function applyBidPlaced(
  current: AuctionRoom | null,
  update: BidPlacedUpdate,
): AuctionRoom | null {
  if (!current || current.id !== update.auctionId) return current

  const bids = current.bids.some((bid) => bid.id === update.bid.id)
    ? current.bids
    : [update.bid, ...current.bids]

  return {
    ...current,
    currentPrice: update.currentPrice,
    leader: update.leader ?? current.leader,
    bids,
    endsAt: update.endsAt ?? current.endsAt,
  }
}

export function useAuction(id: string, token: string | null) {
  const { user } = useSession()
  const userId = user?.id ?? ''

  const [auction, setAuction] = useState<AuctionRoom | null>(null)
  const [loadedKey, setLoadedKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [bidError, setBidError] = useState<string | null>(null)
  const [bidding, setBidding] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  // Bumped when a scheduled auction reaches its start (or an active one its end)
  // so the page asks the server again even if no socket event arrived.
  const [boundaryTick, setBoundaryTick] = useState(0)

  const auctionRef = useRef<AuctionRoom | null>(null)
  useEffect(() => {
    auctionRef.current = auction
  }, [auction])

  const requestKey = `${id}|${attempt}`
  const loading = loadedKey !== requestKey

  const auctionId = auction?.id ?? ''
  const auctionStatus = auction?.status ?? 'active'
  const auctionEndsAt = auction?.endsAt ?? null

  useEffect(() => {
    let active = true

    auctionRoomService
      .getAuction(id)
      .then((dto) => {
        if (!active) return
        setAuction(adaptAuctionRoom(dto))
        setError(null)
        setNotFound(false)
        setBidError(null)
        setLoadedKey(requestKey)
      })
      .catch((cause: unknown) => {
        if (!active) return
        const apiError = cause instanceof ApiError ? cause : null
        const missing =
          apiError?.status === 404 || apiError?.code === 'AUCTION_NOT_FOUND'
        setAuction(null)
        setNotFound(missing)
        setError(missing ? null : (apiError?.message ?? LOAD_ERROR))
        setBidError(null)
        setLoadedKey(requestKey)
      })

    return () => {
      active = false
    }
  }, [id, requestKey])

  useEffect(() => {
    if (!auctionId || auctionId !== id) return

    const realtime = createAuctionRoomRealtime()
    const unsubscribe = realtime.subscribe(
      {
        auctionId,
        token,
        userId,
        status: auctionStatus,
        endsAt: auctionEndsAt,
      },
      {
        onBidPlaced: (dto) => {
          const update = adaptBidPlaced(dto)
          if (!update || update.auctionId !== auctionId) return
          setAuction((current) => applyBidPlaced(current, update))
          setAnnouncement(
            `New bid of ${formatMoney(update.currentPrice)} by ${
              update.leader?.name ?? 'a buyer'
            }.`,
          )
        },
        onViewers: (dto) => {
          const update = adaptViewers(dto)
          if (!update || update.auctionId !== auctionId) return
          setAuction((current) =>
            current && current.id === update.auctionId
              ? { ...current, viewerCount: update.count }
              : current,
          )
        },
        onEnded: (dto) => {
          const update = adaptAuctionEnded(dto)
          if (!update || update.auctionId !== auctionId) return
          setAuction((current) =>
            current && current.id === update.auctionId
              ? {
                  ...current,
                  status: 'ended',
                  winner: update.winner,
                  currentPrice: update.currentPrice || current.currentPrice,
                }
              : current,
          )
          setBidError(null)
          setAnnouncement(
            update.winner
              ? `Auction ended. ${update.winner.name} won with ${formatMoney(
                  update.currentPrice,
                )}.`
              : 'Auction ended with no winner.',
          )
        },
        onBidRejected: (dto) => {
          const update = adaptBidRejected(dto)
          if (!update || update.auctionId !== auctionId) return
          if (!userId || update.bidderId !== userId) return
          setBidError(update.message)
        },
      },
    )

    return unsubscribe
  }, [auctionEndsAt, auctionId, auctionStatus, id, token, userId])

  const syncAuction = useCallback(async (targetId: string) => {
    try {
      const dto = await auctionRoomService.getAuction(targetId)
      const next = adaptAuctionRoom(dto)
      setAuction((current) => (current && current.id === targetId ? next : current))
    } catch {
      // Keep the current state; the rejected-bid message already explains the race.
    }
  }, [])

  // The server changes `scheduled` -> `active` (and `active` -> `ended`) on its
  // own clock. Socket events usually carry that, but if the room is open before
  // the start or the connection was down, refetch at the boundary.
  useEffect(() => {
    const current = auction
    if (!current || current.status === 'ended') return
    const boundary = current.status === 'scheduled' ? current.startsAt : current.endsAt
    if (!boundary) return
    const at = Date.parse(boundary)
    if (Number.isNaN(at)) return

    const wait = at - Date.now()
    if (wait > 0) {
      const timer = setTimeout(() => setBoundaryTick((value) => value + 1), wait + 750)
      return () => clearTimeout(timer)
    }

    const interval = setInterval(() => {
      void syncAuction(current.id)
    }, 2000)
    return () => clearInterval(interval)
  }, [auction, boundaryTick, syncAuction])

  const placeBid = useCallback(
    async (amount: number): Promise<PlaceBidResult> => {
      const current = auctionRef.current
      if (!current) {
        return { ok: false, kind: 'error', message: 'This auction is not ready yet.' }
      }
      if (!user) {
        return { ok: false, kind: 'error', message: 'Log in as a buyer to place a bid.' }
      }
      if (user.role !== 'buyer') {
        return {
          ok: false,
          kind: 'error',
          message: 'Only buyer accounts can place bids.',
        }
      }
      if (current.producer.id && current.producer.id === user.id) {
        return { ok: false, kind: 'error', message: 'You cannot bid on your own lot.' }
      }
      if (current.status !== 'active') {
        return {
          ok: false,
          kind: 'error',
          message: 'Bidding has closed for this auction.',
        }
      }

      const minimum = roundMoney(current.currentPrice + current.increment)
      const value = roundMoney(amount)
      if (!Number.isFinite(amount) || amount <= 0) {
        return { ok: false, kind: 'invalid', message: 'Enter a bid amount.' }
      }
      if (value < minimum) {
        return {
          ok: false,
          kind: 'invalid',
          message: `Your bid must be at least ${formatMoney(minimum)}.`,
        }
      }

      setBidding(true)
      setBidError(null)

      try {
        const dto = await auctionRoomService.placeBid(current.id, value, {
          id: user.id,
          name: user.name,
        })
        const bid = adaptBid(dto)
        if (!bid) {
          return { ok: false, kind: 'error', message: BID_ERROR }
        }

        setAuction((previous) =>
          applyBidPlaced(previous, {
            auctionId: current.id,
            bid,
            currentPrice: bid.amount,
            leader: { id: bid.bidderId, name: bid.bidderName },
            endsAt: current.endsAt,
          }),
        )
        setAnnouncement(`Your bid of ${formatMoney(bid.amount)} was accepted.`)
        return { ok: true, bid }
      } catch (cause) {
        const apiError = cause instanceof ApiError ? cause : null
        const message = apiError?.message ?? BID_ERROR

        if (apiError?.status === 409) {
          setBidError(message)
          // The server is ahead of this tab; accept its state instead of guessing.
          void syncAuction(current.id)
          return { ok: false, kind: 'rejected', message }
        }

        return { ok: false, kind: 'error', message }
      } finally {
        setBidding(false)
      }
    },
    [syncAuction, user],
  )

  const clearBidError = useCallback(() => {
    setBidError(null)
  }, [])

  const reload = useCallback(() => {
    setBidError(null)
    setAttempt((value) => value + 1)
  }, [])

  return {
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
  }
}
