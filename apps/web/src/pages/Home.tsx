import { useSearchParams } from 'react-router-dom'

export default function Home() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q')?.trim()

  return (
    <section className="flex flex-col gap-4 py-6 md:py-10">
      <h1>Local produce and live auctions</h1>
      {query ? (
        <p className="text-dim">
          Results for <strong>“{query}”</strong>.
        </p>
      ) : (
        <p className="measure text-xl text-dim">
          Find producers near you, buy directly from them and bid on seasonal lots in live auctions.
        </p>
      )}
    </section>
  )
}
