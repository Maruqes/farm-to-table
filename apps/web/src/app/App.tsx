import { BrowserRouter } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Toaster } from '@/components/ui/sonner'
import { SessionProvider } from '@/context/SessionProvider'
import { AppRoutes } from './routes'

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <AppShell>
          <AppRoutes />
        </AppShell>
      </SessionProvider>
      <Toaster />
    </BrowserRouter>
  )
}
