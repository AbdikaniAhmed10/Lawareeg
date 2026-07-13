import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

/** True when the user has verified their email (or is a seeded demo with email_verified). */
export function isEmailVerified(user) {
  if (!user) return false
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
