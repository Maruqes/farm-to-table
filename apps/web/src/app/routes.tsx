import { Route, Routes } from 'react-router-dom'
import HomePage from '@/pages/HomePage'
import ProductDetailPage from '@/pages/ProductDetailPage'
import ProducerPublicPage from '@/pages/ProducerPublicPage'
import AuthPage from '@/pages/AuthPage'
import ProducerStatusPage from '@/pages/ProducerStatusPage'
import CartPage from '@/pages/CartPage'
import CheckoutPage from '@/pages/CheckoutPage'
import MyOrdersPage from '@/pages/MyOrdersPage'
import ProfilePage from '@/pages/ProfilePage'
import { AUTHENTICATED_ROLES } from '@/context/roles'
import { RequireRole } from './RequireRole'
import AccountPage from './AccountPage'
import NotFoundPage from './NotFoundPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/products/:id" element={<ProductDetailPage />} />
      <Route path="/producers/:id" element={<ProducerPublicPage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/producer/status" element={<RequireRole roles={['producer']}><ProducerStatusPage /></RequireRole>} />
      <Route path="/account" element={<RequireRole roles={[...AUTHENTICATED_ROLES]}><AccountPage /></RequireRole>} />
      <Route path="/cart" element={<RequireRole roles={['buyer']}><CartPage /></RequireRole>} />
      <Route path="/checkout" element={<RequireRole roles={['buyer']}><CheckoutPage /></RequireRole>} />
      <Route path="/orders" element={<RequireRole roles={['buyer']}><MyOrdersPage /></RequireRole>} />
      <Route path="/profile" element={<RequireRole roles={['buyer', 'producer']}><ProfilePage /></RequireRole>} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
