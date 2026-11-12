import { useCallback, useEffect, useMemo, useState } from 'react'
import { PageState } from '@/components/PageState'
import { useSession } from '@/context/session'
import { CardForm } from './CardForm'
import { DetailsForm } from './DetailsForm'
import { profileService } from './profile.service'
import type { Profile, ProfileSeed } from './profile.types'

export function ProfileView() {
  const { user, role } = useSession()
  const seed = useMemo<ProfileSeed | null>(
    () => (user ? { id: user.id, name: user.name, email: user.email } : null),
    [user],
  )
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  const retry = useCallback(() => {
    setLoading(true)
    setError(null)
    setAttempt((n) => n + 1)
  }, [])

  useEffect(() => {
    if (!seed) return
    let cancelled = false
    profileService
      .getProfile(seed)
      .then((loaded) => !cancelled && setProfile(loaded))
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Unknown error')
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [seed, attempt])

  return (
    <div className="mx-auto flex w-full max-w-[42rem] flex-col gap-6">
      <h1 className="mb-0">My profile</h1>
      <PageState
        loading={loading}
        error={error}
        errorMessage="We couldn’t load your profile. Check your connection and try again."
        onRetry={retry}
      >
        {profile && seed && (
          <>
            <section aria-labelledby="details-heading" className="rule flex flex-col gap-4 pt-6">
              <h2 id="details-heading" className="mb-0">
                Personal details
              </h2>
              <DetailsForm key={profile.email + profile.name} profile={profile} seed={seed} onSaved={setProfile} />
            </section>
            {role === 'buyer' && (
              <section aria-labelledby="card-heading" className="rule flex flex-col gap-4 pt-6">
                <h2 id="card-heading" className="mb-0">
                  Payment card
                </h2>
                <p className="measure mb-0 text-sm text-dim">
                  If you win an auction, this card is charged. If it is declined, the next
                  highest bidder is tried.
                </p>
                <CardForm key={profile.card?.last4 ?? 'none'} profile={profile} seed={seed} onSaved={setProfile} />
              </section>
            )}
          </>
        )}
      </PageState>
    </div>
  )
}
