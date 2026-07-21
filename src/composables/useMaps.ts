/**
 * Ouvre un itinéraire vers des coordonnées dans l'app GPS native de l'appareil.
 * - iOS / macOS : Apple Plans
 * - Android / autres : Google Maps (URL universelle, ouvre l'app si installée)
 */
export function useMaps() {
  function isApplePlatform() {
    return /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)
  }

  function buildMapsUrl(lat: number, lng: number, label?: string) {
    const coords = `${lat},${lng}`
    if (isApplePlatform()) {
      const q = label ? `&q=${encodeURIComponent(label)}` : ''
      return `https://maps.apple.com/?daddr=${coords}${q}`
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${coords}`
  }

  function openInMaps(lat: number, lng: number, label?: string) {
    window.open(buildMapsUrl(lat, lng, label), '_blank', 'noopener')
  }

  return { buildMapsUrl, openInMaps }
}
