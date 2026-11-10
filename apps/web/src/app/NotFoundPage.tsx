import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <section className="flex flex-col items-center gap-4 py-20 text-center">
      <h1 className="text-3xl font-semibold">This page doesn’t exist</h1>
      <p className="max-w-md text-muted-foreground">
        The address you followed is wrong or the page has been removed.
      </p>
      <Button asChild>
        <Link to="/">Back to home</Link>
      </Button>
    </section>
  )
}
