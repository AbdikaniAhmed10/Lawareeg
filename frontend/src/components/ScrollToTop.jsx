import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

function resetScroll() {
  window.scrollTo(0, 0)
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0

  // Admin/dashboard use overflow on <main> / panels — window scroll alone is not enough.
  document.querySelectorAll('main, [data-scroll-root]').forEach((el) => {
    if (el instanceof HTMLElement) {
      el.scrollTop = 0
      el.scrollLeft = 0
    }
  })
}

/**
 * Scroll to top (or hash target) whenever the route changes.
 * Covers window scroll and nested overflow containers (admin panel).
 */
export default function ScrollToTop() {
  const { pathname, hash, key } = useLocation()

  useLayoutEffect(() => {
    if (hash) {
      const id = hash.replace('#', '')
      requestAnimationFrame(() => {
        const el = document.getElementById(id)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          return
        }
        resetScroll()
      })
      return
    }

    resetScroll()
    // One more pass after layout paints (async pages / images).
    const t = window.setTimeout(resetScroll, 0)
    return () => window.clearTimeout(t)
  }, [pathname, hash, key])

  return null
}
