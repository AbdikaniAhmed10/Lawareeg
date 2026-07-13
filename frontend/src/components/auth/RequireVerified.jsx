import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

/** True when email is verified, or the user is an admin (admins skip OTP). */
export function isEmailVerified(user) {
  if (!user) return false
  if (user.role === 'admin') return true
  return Boolean(user.email_verified || user.email_verified_at)
}

/** Gate for dashboard/admin — requires auth + verified email. */
export function RequireVerified({ children, fallback = '/verify-email' }) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!isEmailVerified(user)) {
    return <Navigate to={fallback} replace />
  }

  return children
}

export default RequireVerified
