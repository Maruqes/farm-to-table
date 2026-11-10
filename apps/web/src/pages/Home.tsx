import { useSearchParams } from 'react-router-dom'

export default function Home() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q')?.trim()

  return (
    <section className="space-y-3 py-6 md:py-10">
      <h1 className="max-w-3xl text-4xl font-semibold md:text-5xl">Local produce and live auctions</h1>
      {query ? (
        <p className="text-muted-foreground">
          Results for <strong>“{query}”</strong>.
        </p>
      ) : (
        <p className="max-w-[60ch] text-lg text-muted-foreground">
          Find producers near you, buy directly from them and bid on seasonal lots in live auctions.
        </p>
      )}
    </section>
  )
}
