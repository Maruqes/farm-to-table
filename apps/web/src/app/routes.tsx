import { Route, Routes } from 'react-router-dom'
import HomePage from '@/pages/HomePage'
import AuthPage from '@/pages/AuthPage'
import ProducerStatusPage from '@/pages/ProducerStatusPage'
import { AUTHENTICATED_ROLES } from '@/context/roles'
import { RequireRole } from './RequireRole'
import AccountPage from './AccountPage'
import NotFoundPage from './NotFoundPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/producer/status" element={<RequireRole roles={['producer']}><ProducerStatusPage /></RequireRole>} />
      <Route path="/account" element={<RequireRole roles={[...AUTHENTICATED_ROLES]}><AccountPage /></RequireRole>} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
