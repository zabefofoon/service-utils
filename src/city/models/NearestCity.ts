export interface NearestCity {
  geonameId: number
  name: string
  countryCode: string
  lat: number
  lon: number
  timezone: string | null
  distanceM: number
}
