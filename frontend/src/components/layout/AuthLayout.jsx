import { Outlet } from 'react-router-dom'
import Footer from './Footer'

/** Auth screens + contact footer (TikTok / WhatsApp). */
export default function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer compact />
    </div>
  )
}
