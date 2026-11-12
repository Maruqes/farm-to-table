import { useSearchParams } from 'react-router-dom'

export default function Home() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q')?.trim()

  return (
    <section className="catalog-hero vstack gap-3">
      <h1>Local produce and live auctions</h1>
      {query ? (
        <p className="text-body-secondary">
          Results for <strong>“{query}”</strong>.
        </p>
      ) : (
        <p className="measure fs-5 text-body-secondary">
          Find producers near you, buy directly from them and bid on seasonal lots in live auctions.
        </p>
      )}
    </section>
  )
}
