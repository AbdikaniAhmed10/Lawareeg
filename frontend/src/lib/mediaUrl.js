const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace(/\/api\/?$/, '')

/**
 * Make media URLs work from the Vite frontend (port 5173) against Laravel (port 8000).
 * Absolute http(s) URLs are left alone; /storage/... paths are prefixed with the API origin.
 */
export function mediaUrl(pathOrUrl) {
  if (!pathOrUrl) return null
  const value = String(pathOrUrl).trim()
  if (!value) return null
  if (/^https?:\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) {
    return value
  }
  if (value.startsWith('//')) {
    return `${window.location.protocol}${value}`
  }
  if (value.startsWith('/')) {
    return `${API_ORIGIN}${value}`
  }
  return `${API_ORIGIN}/storage/${value.replace(/^storage\//, '')}`
}

export default mediaUrl
