import { Route, Routes } from 'react-router-dom'
import HomePage from '@/pages/HomePage'
import ProductDetailPage from '@/pages/ProductDetailPage'
import ProducerPublicPage from '@/pages/ProducerPublicPage'
import AuctionRoomPage from '@/pages/AuctionRoomPage'
import AuthPage from '@/pages/AuthPage'
import ProducerStatusPage from '@/pages/ProducerStatusPage'
import ProducerDashboardPage from '@/pages/ProducerDashboardPage'
import ProducerProductsPage from '@/pages/ProducerProductsPage'
import ProducerOrdersPage from '@/pages/ProducerOrdersPage'
import ProducerReviewsPage from '@/pages/ProducerReviewsPage'
import ProducerAuctionsPage from '@/pages/ProducerAuctionsPage'
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
      <Route path="/auctions/:id" element={<AuctionRoomPage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/producer" element={<RequireRole roles={['producer']}><ProducerDashboardPage /></RequireRole>} />
      <Route path="/producer/products" element={<RequireRole roles={['producer']}><ProducerProductsPage /></RequireRole>} />
      <Route path="/producer/orders" element={<RequireRole roles={['producer']}><ProducerOrdersPage /></RequireRole>} />
      <Route path="/producer/reviews" element={<RequireRole roles={['producer']}><ProducerReviewsPage /></RequireRole>} />
      <Route path="/producer/auctions" element={<RequireRole roles={['producer']}><ProducerAuctionsPage /></RequireRole>} />
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
