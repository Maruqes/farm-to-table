import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/services/api'
import { adaptProducerPage } from './producer-page-edit.adapter'
import { producerPageEditService } from './producer-page-edit.service'
import type { ProducerPage, ProducerPageInput } from './producer-page-edit.types'

const LOAD_ERROR =
  'Your public page could not be loaded. Check your connection and try again.'

interface PageSnapshot {
  key: string
  page: ProducerPage | null
  error: string | null
}

export function useProducerPageEdit() {
  const [attempt, setAttempt] = useState(0)
  const [snapshot, setSnapshot] = useState<PageSnapshot>({
    key: '',
    page: null,
    error: null,
  })

  const requestKey = `page|${attempt}`

  useEffect(() => {
    let active = true

    producerPageEditService
      .getMine()
      .then((dto) => {
        if (!active) return
        setSnapshot({
          key: requestKey,
          page: adaptProducerPage(dto),
          error: null,
        })
      })
      .catch((cause: unknown) => {
        if (!active) return
        const apiError = cause instanceof ApiError ? cause : null
        setSnapshot({
          key: requestKey,
          page: null,
          error: apiError?.message ?? LOAD_ERROR,
        })
      })

    return () => {
      active = false
    }
  }, [requestKey])

  const reload = useCallback(() => {
    setAttempt((value) => value + 1)
  }, [])

  const save = useCallback(async (input: ProducerPageInput): Promise<ProducerPage> => {
    const dto = await producerPageEditService.saveMine(input)
    const page = adaptProducerPage(dto)
    setSnapshot((current) => ({ ...current, page, error: null }))
    return page
  }, [])

  const current = snapshot.key === requestKey
  const page = current ? snapshot.page : null
  const loading = !current
  const error = current ? snapshot.error : null

  return {
    page,
    loading,
    error,
    reload,
    save,
  }
}
