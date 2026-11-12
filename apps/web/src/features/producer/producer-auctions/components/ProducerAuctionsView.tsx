import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { PageState } from '@/components/PageState'
import { Button } from '@/components/ui/button'
import { AuctionForm } from './AuctionForm'
import { AuctionList } from './AuctionList'
import { useProducerAuctions } from '../useProducerAuctions'
import type {
  AuctionActionResult,
  AuctionInput,
  AuctionSaveIntent,
  ProducerAuction,
} from '../producer-auctions.types'

function successMessage(intent: AuctionSaveIntent): string {
  if (intent === 'publish') return 'Auction published. It opens at the start time.'
  return 'Draft auction saved. Publish it when you are ready.'
}

export function ProducerAuctionsView() {
  const {
    auctions,
    loading,
    error,
    empty,
    saving,
    announcement,
    reload,
    createAuction,
    updateAuction,
    publishAuction,
    cancelAuction,
  } = useProducerAuctions()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ProducerAuction | null>(null)
  const newAuctionButtonRef = useRef<HTMLButtonElement>(null)

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(auction: ProducerAuction) {
    setEditing(auction)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
    requestAnimationFrame(() => newAuctionButtonRef.current?.focus())
  }

  async function handleSave(
    input: AuctionInput,
    intent: AuctionSaveIntent,
  ): Promise<AuctionActionResult> {
    const result = editing
      ? await updateAuction(editing.id, input, intent === 'publish')
      : await createAuction(input, intent === 'publish')

    if (result.ok) {
      toast.success(successMessage(intent))
      closeForm()
      return result
    }

    if (result.draftSaved) {
      toast.warning(result.message)
      closeForm()
      return { ok: true }
    }

    return result
  }

  async function handlePublish(id: string): Promise<AuctionActionResult> {
    const result = await publishAuction(id)
    if (result.ok) {
      toast.success('Auction published. It opens at the start time.')
    } else {
      toast.error(result.message)
    }
    return result
  }

  async function handleCancel(id: string): Promise<AuctionActionResult> {
    const result = await cancelAuction(id)
    if (result.ok) {
      toast.success('Auction cancelled. It now appears under Ended.')
    }
    return result
  }

  return (
    <section aria-labelledby="producer-auctions-heading" className="vstack gap-4">
      <Link to="/producer" className="pa-back-link small text-body-secondary">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to dashboard
      </Link>

      <header className="d-flex flex-wrap align-items-start justify-content-between gap-3">
        <div className="vstack gap-1">
          <h1 id="producer-auctions-heading">Auctions</h1>
          <p className="measure text-body-secondary">
            Turn your produce into a live lot. Create a draft, publish it, and follow bids
            in the auction room.
          </p>
        </div>
        {!formOpen && (
          <Button ref={newAuctionButtonRef} onClick={openCreate}>
            <Plus size={16} aria-hidden="true" />
            New auction
          </Button>
        )}
      </header>

      <p className="visually-hidden" aria-live="polite">
        {announcement}
      </p>

      {formOpen && (
        <section aria-labelledby="auction-form-heading" className="rule pt-4">
          <div className="vstack gap-1 mb-4">
            <h2 id="auction-form-heading">
              {editing ? 'Edit draft auction' : 'New auction'}
            </h2>
            <p className="small text-body-secondary">
              {editing
                ? 'Drafts can be changed until you publish them. Publishing schedules the lot.'
                : 'Pick one of your products, set the lot and the starting price, then save a draft or publish.'}
            </p>
          </div>
          <AuctionForm
            key={editing?.id ?? 'new'}
            auction={editing}
            onSave={handleSave}
            onCancel={closeForm}
          />
        </section>
      )}

      <PageState
        loading={loading}
        error={error}
        errorMessage={error ?? undefined}
        onRetry={reload}
        empty={empty}
        emptyMessage="You have no auctions yet. Create a draft from one of your products and publish it when you are ready."
      >
        {auctions.length > 0 && (
          <AuctionList
            auctions={auctions}
            busy={saving}
            onEdit={openEdit}
            onPublish={handlePublish}
            onCancel={handleCancel}
          />
        )}
      </PageState>
    </section>
  )
}
