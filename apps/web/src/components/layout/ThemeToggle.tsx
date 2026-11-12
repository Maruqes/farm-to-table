import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

// The initial data-bs-theme is set before paint by the inline script in index.html.
export function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.getAttribute('data-bs-theme') === 'dark')

  function toggle() {
    const next = !dark
    document.documentElement.setAttribute('data-bs-theme', next ? 'dark' : 'light')
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {
      // storage blocked: the choice lasts for this page only
    }
    setDark(next)
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
      {dark ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
    </Button>
  )
}
