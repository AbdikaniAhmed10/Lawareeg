import { Routes, Route } from 'react-router-dom'

import PublicLayout from './components/layout/PublicLayout'
import DashboardLayout from './components/layout/DashboardLayout'
import AdminLayout from './components/layout/AdminLayout'

import Home from './pages/public/Home'
import Browse from './pages/public/Browse'
import ListingDetail from './pages/public/ListingDetail'
import CategoryPage from './pages/public/CategoryPage'
import UserProfile from './pages/public/UserProfile'
import HowItWorks from './pages/public/HowItWorks'
import FAQ from './pages/public/FAQ'

import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import VerifyEmailNotice from './pages/auth/VerifyEmailNotice'
import VerifyEmailConfirm from './pages/auth/VerifyEmailConfirm'

import Overview from './pages/dashboard/Overview'
import Profile from './pages/dashboard/Profile'
import Favorites from './pages/dashboard/Favorites'
import MyOrders from './pages/dashboard/MyOrders'
import MyListings from './pages/dashboard/MyListings'
import CreateListing from './pages/dashboard/CreateListing'
import EditListing from './pages/dashboard/EditListing'
import Messages from './pages/dashboard/Messages'
import Conversation from './pages/dashboard/Conversation'
import Wallet from './pages/dashboard/Wallet'
import Notifications from './pages/dashboard/Notifications'
import Reviews from './pages/dashboard/Reviews'

import SellerVerification from './pages/seller/SellerVerification'
import Withdrawals from './pages/seller/Withdrawals'

import BuyNow from './pages/checkout/BuyNow'
import UploadPaymentProof from './pages/checkout/UploadPaymentProof'
import ConfirmReceipt from './pages/checkout/ConfirmReceipt'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminVerifications from './pages/admin/AdminVerifications'
import AdminListings from './pages/admin/AdminListings'
import AdminOrders from './pages/admin/AdminOrders'
import AdminWithdrawals from './pages/admin/AdminWithdrawals'
import AdminCategories from './pages/admin/AdminCategories'
import AdminDisputes from './pages/admin/AdminDisputes'
import AdminSupport from './pages/admin/AdminSupport'
import AdminSupportConversation from './pages/admin/AdminSupportConversation'
import AdminSettings from './pages/admin/AdminSettings'
import AdminReports from './pages/admin/AdminReports'

import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      {/* Public marketplace */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/listings/:slug" element={<ListingDetail />} />
        <Route path="/users/:id" element={<UserProfile />} />
        <Route path="/sellers/:id" element={<UserProfile />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/faq" element={<FAQ />} />

        {/* Checkout / manual escrow flow */}
        <Route path="/checkout/buy-now/:slug" element={<BuyNow />} />
        <Route path="/checkout/upload-proof/:id" element={<UploadPaymentProof />} />
        <Route path="/checkout/confirm-receipt/:id" element={<ConfirmReceipt />} />
      </Route>

      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-email" element={<VerifyEmailNotice />} />
      <Route path="/verify-email/:id/:hash" element={<VerifyEmailConfirm />} />

      {/* Buyer / seller dashboard */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<Overview />} />
        <Route path="profile" element={<Profile />} />
        <Route path="favorites" element={<Favorites />} />
        <Route path="orders" element={<MyOrders />} />
        <Route path="my-listings" element={<MyListings />} />
        <Route path="my-listings/new" element={<CreateListing />} />
        <Route path="my-listings/:id/edit" element={<EditListing />} />
        <Route path="messages" element={<Messages />} />
        <Route path="messages/:id" element={<Conversation />} />
        <Route path="wallet" element={<Wallet />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="seller-verification" element={<SellerVerification />} />
        <Route path="withdrawals" element={<Withdrawals />} />
      </Route>

      {/* Admin panel */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="verifications" element={<AdminVerifications />} />
        <Route path="listings" element={<AdminListings />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="withdrawals" element={<AdminWithdrawals />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="disputes" element={<AdminDisputes />} />
        <Route path="support" element={<AdminSupport />} />
        <Route path="support/:id" element={<AdminSupportConversation />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
