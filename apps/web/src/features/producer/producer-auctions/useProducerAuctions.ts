import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from '@/context/session'
import { ApiError } from '@/services/api'
import {
  adaptProducerAuction,
  adaptProducerAuctions,
} from './producer-auctions.adapter'
import { producerAuctionsService } from './producer-auctions.service'
import type {
  AuctionActionResult,
  AuctionInput,
  ProducerAuction,
} from './producer-auctions.types'

const LOAD_ERROR =
  'Your auctions could not be loaded. Check your connection and try again.'
const SAVE_ERROR =
  'The auction could not be saved. Check your connection and try again.'
const PUBLISH_ERROR =
  'The auction could not be published. Open the draft and try again.'
const CANCEL_ERROR =
  'The auction could not be cancelled. Check your connection and try again.'

function upsert(auctions: ProducerAuction[], auction: ProducerAuction): ProducerAuction[] {
  const exists = auctions.some((entry) => entry.id === auction.id)
  if (exists) {
    return auctions.map((entry) => (entry.id === auction.id ? auction : entry))
  }
  return [auction, ...auctions]
}

export function useProducerAuctions() {
  const { user } = useSession()
  const userId = user?.id ?? ''

  const [auctions, setAuctions] = useState<ProducerAuction[]>([])
  const [loadedKey, setLoadedKey] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const savingRef = useRef(false)

  const requestKey = `auctions|${attempt}`
  const loading = loadedKey !== requestKey

  useEffect(() => {
    if (!userId) return

    let active = true

    producerAuctionsService
      .listMine()
      .then((dtos) => {
        if (!active) return
        setAuctions(adaptProducerAuctions(dtos))
        setError(null)
        setLoadedKey(requestKey)
      })
      .catch((cause: unknown) => {
        if (!active) return
        const apiError = cause instanceof ApiError ? cause : null
        setAuctions([])
        setError(apiError?.message ?? LOAD_ERROR)
        setLoadedKey(requestKey)
      })

    return () => {
      active = false
    }
  }, [requestKey, userId])

  const reload = useCallback(() => {
    setError(null)
    setAttempt((value) => value + 1)
  }, [])

  const beginSave = useCallback((): boolean => {
    if (savingRef.current) return false
    savingRef.current = true
    setSaving(true)
    return true
  }, [])

  const endSave = useCallback(() => {
    savingRef.current = false
    setSaving(false)
  }, [])

  const createAuction = useCallback(
    async (input: AuctionInput, publish: boolean): Promise<AuctionActionResult> => {
      if (!beginSave()) {
        return {
          ok: false,
          message: 'Another auction change is still saving. Please wait a moment.',
        }
      }

      try {
        const createdDto = await producerAuctionsService.create(input)
        const created = adaptProducerAuction(createdDto)
        setAuctions((current) => upsert(current, created))
        setAnnouncement(`Draft auction for ${created.product.name} saved.`)

        if (!publish) return { ok: true }

        try {
          const publishedDto = await producerAuctionsService.publish(created.id)
          const published = adaptProducerAuction(publishedDto)
          setAuctions((current) => upsert(current, published))
          setAnnouncement(`Auction for ${published.product.name} published.`)
          return { ok: true }
        } catch (cause) {
          return {
            ok: false,
            draftSaved: true,
            message:
              cause instanceof ApiError
                ? `Draft saved, but publishing failed: ${cause.message}`
                : `Draft saved, but publishing failed. Open the draft and publish it again.`,
          }
        }
      } catch (cause) {
        const apiError = cause instanceof ApiError ? cause : null
        return {
          ok: false,
          message: apiError?.message ?? SAVE_ERROR,
          fields: apiError?.fields,
        }
      } finally {
        endSave()
      }
    },
    [beginSave, endSave],
  )

  const updateAuction = useCallback(
    async (
      id: string,
      input: AuctionInput,
      publish: boolean,
    ): Promise<AuctionActionResult> => {
      if (!beginSave()) {
        return {
          ok: false,
          message: 'Another auction change is still saving. Please wait a moment.',
        }
      }

      try {
        const updatedDto = await producerAuctionsService.update(id, input)
        const updated = adaptProducerAuction(updatedDto)
        setAuctions((current) => upsert(current, { ...updated, id }))
        setAnnouncement(`Draft auction for ${updated.product.name} saved.`)

        if (!publish) return { ok: true }

        try {
          const publishedDto = await producerAuctionsService.publish(id)
          const published = adaptProducerAuction(publishedDto)
          setAuctions((current) => upsert(current, { ...published, id }))
          setAnnouncement(`Auction for ${published.product.name} published.`)
          return { ok: true }
        } catch (cause) {
          return {
            ok: false,
            draftSaved: true,
            message:
              cause instanceof ApiError
                ? `Draft saved, but publishing failed: ${cause.message}`
                : `Draft saved, but publishing failed. Open the draft and publish it again.`,
          }
        }
      } catch (cause) {
        const apiError = cause instanceof ApiError ? cause : null
        return {
          ok: false,
          message: apiError?.message ?? SAVE_ERROR,
          fields: apiError?.fields,
        }
      } finally {
        endSave()
      }
    },
    [beginSave, endSave],
  )

  const publishAuction = useCallback(
    async (id: string): Promise<AuctionActionResult> => {
      if (!beginSave()) {
        return {
          ok: false,
          message: 'Another auction change is still saving. Please wait a moment.',
        }
      }

      try {
        const dto = await producerAuctionsService.publish(id)
        const auction = adaptProducerAuction(dto)
        setAuctions((current) => upsert(current, { ...auction, id }))
        setAnnouncement(`Auction for ${auction.product.name} published.`)
        return { ok: true }
      } catch (cause) {
        return {
          ok: false,
          message: cause instanceof ApiError ? cause.message : PUBLISH_ERROR,
        }
      } finally {
        endSave()
      }
    },
    [beginSave, endSave],
  )

  const cancelAuction = useCallback(
    async (id: string): Promise<AuctionActionResult> => {
      if (!beginSave()) {
        return {
          ok: false,
          message: 'Another auction change is still saving. Please wait a moment.',
        }
      }

      try {
        const dto = await producerAuctionsService.cancel(id)
        const auction = adaptProducerAuction(dto)
        setAuctions((current) => upsert(current, { ...auction, id }))
        setAnnouncement('Auction cancelled. It now appears under Ended.')
        return { ok: true }
      } catch (cause) {
        return {
          ok: false,
          message: cause instanceof ApiError ? cause.message : CANCEL_ERROR,
        }
      } finally {
        endSave()
      }
    },
    [beginSave, endSave],
  )

  return {
    auctions,
    loading,
    error,
    empty: !loading && !error && auctions.length === 0,
    saving,
    announcement,
    reload,
    createAuction,
    updateAuction,
    publishAuction,
    cancelAuction,
  }
}
