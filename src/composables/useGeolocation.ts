export interface Coords {
  lat: number
  lng: number
}

export function useGeolocation() {
  // Position courante du navigateur (Promise).
  function getPosition(): Promise<Coords> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('La géolocalisation n’est pas disponible sur cet appareil.'))
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) =>
          reject(
            new Error(
              err.code === err.PERMISSION_DENIED
                ? 'Autorise la localisation pour valider une étape.'
                : 'Impossible d’obtenir ta position. Réessaie.',
            ),
          ),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      )
    })
  }

  // Distance en mètres entre deux points (formule de Haversine).
  function distanceMeters(a: Coords, b: Coords): number {
    const R = 6371000
    const toRad = (d: number) => (d * Math.PI) / 180
    const dLat = toRad(b.lat - a.lat)
    const dLng = toRad(b.lng - a.lng)
    const lat1 = toRad(a.lat)
    const lat2 = toRad(b.lat)
    const h =
      Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
    return 2 * R * Math.asin(Math.sqrt(h))
  }

  return { getPosition, distanceMeters }
}
