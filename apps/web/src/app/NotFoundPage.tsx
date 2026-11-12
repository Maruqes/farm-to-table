import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <section className="auth-column-wide d-flex flex-column align-items-start gap-3 py-5">
      <p className="label-line mb-0">Error 404</p>
      <h1 className="mb-0">This page doesn’t exist</h1>
      <p className="measure text-body-secondary mb-0">
        The address you followed is wrong or the page has been removed.
      </p>
      <Button asChild>
        <Link to="/">Back to home</Link>
      </Button>
    </section>
  )
}
