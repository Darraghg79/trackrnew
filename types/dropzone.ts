export interface DropZoneCoordinates {
  latitude: number
  longitude: number
}

export interface DropZone {
  id: string
  name: string
  address: string
  cityLocation?: string
  coordinates?: DropZoneCoordinates
  country?: string
  continent?: string
  elevation?: number
  isUserAdded: boolean
  billingDetails?: {
    address: string
    financeContact: string
    financeEmail: string
  }
}

export interface DropZoneJumpStats {
  dropZoneId: string
  dropZoneName: string
  jumpCount: number
  percentage: number
  coordinates?: DropZoneCoordinates
  address: string
}

export interface LocationCluster {
  level: "continent" | "country" | "dropzone"
  name: string
  jumpCount: number
  percentage: number
  coordinates?: DropZoneCoordinates
  children?: LocationCluster[]
}
