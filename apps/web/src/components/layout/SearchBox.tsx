import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function SearchBox() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [value, setValue] = useState(searchParams.get('q') ?? '')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = value.trim()
    navigate(query ? `/?q=${encodeURIComponent(query)}` : '/')
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="flex w-full items-center gap-2">
      <label htmlFor="site-search" className="sr-only">
        Search products
      </label>
      <Input
        id="site-search"
        name="q"
        type="search"
        placeholder="Search products, producers…"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <Button type="submit" size="icon" variant="outline" aria-label="Search">
        <Search size={16} aria-hidden="true" />
      </Button>
    </form>
  )
}
