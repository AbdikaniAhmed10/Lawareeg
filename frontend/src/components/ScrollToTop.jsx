import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Scroll to top (or hash target) whenever the route changes.
 * React Router keeps the previous scroll position by default.
 */
export default function ScrollToTop() {
  const { pathname, hash, key } = useLocation()

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '')
      // Wait a tick so the destination page can mount.
      requestAnimationFrame(() => {
        const el = document.getElementById(id)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          return
        }
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' in window ? 'instant' : 'auto' })
      })
      return
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' in window ? 'instant' : 'auto' })
  }, [pathname, hash, key])

  return null
}
