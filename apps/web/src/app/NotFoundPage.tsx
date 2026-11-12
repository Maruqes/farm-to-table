import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-start gap-4 py-12">
      <p className="label-line">Error 404</p>
      <h1>This page doesn’t exist</h1>
      <p className="measure text-dim">
        The address you followed is wrong or the page has been removed.
      </p>
      <Button asChild>
        <Link to="/">Back to home</Link>
      </Button>
    </section>
  )
}
