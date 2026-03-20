// useLocation.ts — browser geolocation + reverse geocode to city/state
// Uses OpenStreetMap Nominatim (free, no API key needed)

export type LocationData = {
  city: string
  state: string
  country: string
  display: string   // e.g. "Delhi, Delhi"
  lat: number
  lon: number
}

export async function detectLocation(): Promise<LocationData | null> {
  if (!navigator.geolocation) return null

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'en', 'User-Agent': 'productrating.in/1.0' } }
          )
          const data = await res.json()
          const addr = data.address || {}

          // Nominatim field priority for Indian cities
          const city =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.municipality ||
            addr.county ||
            addr.district ||
            ''

          const state = addr.state || ''
          const country = addr.country_code?.toUpperCase() || ''

          const display = [city, state].filter(Boolean).join(', ')

          resolve({ city, state, country, display, lat, lon })
        } catch {
          resolve(null)
        }
      },
      () => resolve(null),   // permission denied or error
      { timeout: 8000, maximumAge: 300000 }  // 5-min cache
    )
  })
}

// Save/load from sessionStorage so we don't ask again on every page
export function getCachedLocation(): LocationData | null {
  try {
    const raw = sessionStorage.getItem('pr_location')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function cacheLocation(loc: LocationData) {
  try { sessionStorage.setItem('pr_location', JSON.stringify(loc)) } catch {}
}
