import type { DropZone } from "@/types/dropzone"

// This will be populated with the processed CSV data
// For now, including a sample to show the structure
export const DROPZONE_DATABASE: DropZone[] = [
  // Europe
  {
    id: "dz_irish_parachute_club",
    name: "Irish Parachute Club",
    address: "Clonbullogue, Offaly, Ireland",
    coordinates: { latitude: 53.2847, longitude: -7.4147 },
    country: "Ireland",
    continent: "Europe",
    isUserAdded: false,
    billingDetails: {
      address: "Irish Parachute Club\nClonbullogue\nOffaly\nIreland",
      financeContact: "Finance Department",
      financeEmail: "shop@skydive.ie",
    },
  },
  {
    id: "dz_skydive_spain",
    name: "Skydive Spain",
    address: "Seville, Spain",
    coordinates: { latitude: 37.3891, longitude: -5.9845 },
    country: "Spain",
    continent: "Europe",
    isUserAdded: false,
  },
  {
    id: "dz_uk_parachuting",
    name: "UK Parachuting",
    address: "Hibaldstow, UK",
    coordinates: { latitude: 53.4668, longitude: -0.4833 },
    country: "United Kingdom",
    continent: "Europe",
    isUserAdded: false,
  },
  {
    id: "dz_dropzone_texel",
    name: "Dropzone Texel",
    address: "Texel, Netherlands",
    coordinates: { latitude: 53.0608, longitude: 4.7614 },
    country: "Netherlands",
    continent: "Europe",
    isUserAdded: false,
  },
  {
    id: "dz_skydive_empuriabrava",
    name: "Skydive Empuriabrava",
    address: "Empuriabrava, Spain",
    coordinates: { latitude: 42.2472, longitude: 3.1203 },
    country: "Spain",
    continent: "Europe",
    isUserAdded: false,
  },
  {
    id: "dz_skydive_algarve",
    name: "Skydive Algarve",
    address: "Portimão, Portugal",
    coordinates: { latitude: 37.1393, longitude: -8.5376 },
    country: "Portugal",
    continent: "Europe",
    isUserAdded: false,
  },
  {
    id: "dz_skydive_switzerland",
    name: "Skydive Switzerland",
    address: "Interlaken, Switzerland",
    coordinates: { latitude: 46.6863, longitude: 7.8632 },
    country: "Switzerland",
    continent: "Europe",
    isUserAdded: false,
  },
  {
    id: "dz_skydive_austria",
    name: "Skydive Austria",
    address: "Salzburg, Austria",
    coordinates: { latitude: 47.8095, longitude: 13.055 },
    country: "Austria",
    continent: "Europe",
    isUserAdded: false,
  },
  {
    id: "dz_skydive_germany",
    name: "Skydive Germany",
    address: "Munich, Germany",
    coordinates: { latitude: 48.1351, longitude: 11.582 },
    country: "Germany",
    continent: "Europe",
    isUserAdded: false,
  },
  {
    id: "dz_skydive_france",
    name: "Skydive France",
    address: "Nice, France",
    coordinates: { latitude: 43.7102, longitude: 7.262 },
    country: "France",
    continent: "Europe",
    isUserAdded: false,
  },

  // North America
  {
    id: "dz_skydive_california",
    name: "Skydive California",
    address: "Davis, California, USA",
    coordinates: { latitude: 38.5449, longitude: -121.7405 },
    country: "United States",
    continent: "North America",
    isUserAdded: false,
  },
  {
    id: "dz_skydive_chicago",
    name: "Skydive Chicago",
    address: "Ottawa, Illinois, USA",
    coordinates: { latitude: 41.3456, longitude: -88.8426 },
    country: "United States",
    continent: "North America",
    isUserAdded: false,
  },
  {
    id: "dz_skydive_miami",
    name: "Skydive Miami",
    address: "Homestead, Florida, USA",
    coordinates: { latitude: 25.4687, longitude: -80.4776 },
    country: "United States",
    continent: "North America",
    isUserAdded: false,
  },
  {
    id: "dz_skydive_vancouver",
    name: "Skydive Vancouver",
    address: "Abbotsford, BC, Canada",
    coordinates: { latitude: 49.0504, longitude: -122.3045 },
    country: "Canada",
    continent: "North America",
    isUserAdded: false,
  },
  {
    id: "dz_skydive_toronto",
    name: "Skydive Toronto",
    address: "Baldwin, Ontario, Canada",
    coordinates: { latitude: 44.0389, longitude: -79.3473 },
    country: "Canada",
    continent: "North America",
    isUserAdded: false,
  },

  // Asia
  {
    id: "dz_skydive_dubai",
    name: "Skydive Dubai",
    address: "Dubai, UAE",
    coordinates: { latitude: 25.2048, longitude: 55.2708 },
    country: "United Arab Emirates",
    continent: "Asia",
    isUserAdded: false,
  },
  {
    id: "dz_skydive_japan",
    name: "Skydive Japan",
    address: "Tokyo, Japan",
    coordinates: { latitude: 35.6762, longitude: 139.6503 },
    country: "Japan",
    continent: "Asia",
    isUserAdded: false,
  },
  {
    id: "dz_skydive_thailand",
    name: "Skydive Thailand",
    address: "Pattaya, Thailand",
    coordinates: { latitude: 12.9236, longitude: 100.8825 },
    country: "Thailand",
    continent: "Asia",
    isUserAdded: false,
  },

  // Oceania
  {
    id: "dz_skydive_sydney",
    name: "Skydive Sydney",
    address: "Wollongong, NSW, Australia",
    coordinates: { latitude: -34.4278, longitude: 150.8931 },
    country: "Australia",
    continent: "Oceania",
    isUserAdded: false,
  },
  {
    id: "dz_skydive_queenstown",
    name: "Skydive Queenstown",
    address: "Queenstown, New Zealand",
    coordinates: { latitude: -45.0312, longitude: 168.6626 },
    country: "New Zealand",
    continent: "Oceania",
    isUserAdded: false,
  },

  // South America
  {
    id: "dz_skydive_brazil",
    name: "Skydive Brazil",
    address: "São Paulo, Brazil",
    coordinates: { latitude: -23.5505, longitude: -46.6333 },
    country: "Brazil",
    continent: "South America",
    isUserAdded: false,
  },
  {
    id: "dz_skydive_argentina",
    name: "Skydive Argentina",
    address: "Buenos Aires, Argentina",
    coordinates: { latitude: -34.6118, longitude: -58.396 },
    country: "Argentina",
    continent: "South America",
    isUserAdded: false,
  },

  // Africa
  {
    id: "dz_skydive_south_africa",
    name: "Skydive South Africa",
    address: "Cape Town, South Africa",
    coordinates: { latitude: -33.9249, longitude: 18.4241 },
    country: "South Africa",
    continent: "Africa",
    isUserAdded: false,
  },
]

export const DROPZONE_NAMES: string[] = DROPZONE_DATABASE.map((dz) => dz.name)

export const DROPZONE_STATS = {
  total: DROPZONE_DATABASE.length,
  withCoordinates: DROPZONE_DATABASE.filter((dz) => dz.coordinates).length,
  continents: new Set(DROPZONE_DATABASE.map((dz) => dz.continent)).size,
  countries: new Set(DROPZONE_DATABASE.map((dz) => dz.country)).size,
}

// Helper functions
export const getDropZoneById = (id: string): DropZone | undefined => {
  return DROPZONE_DATABASE.find((dz) => dz.id === id)
}

export const getDropZoneByName = (name: string): DropZone | undefined => {
  return DROPZONE_DATABASE.find((dz) => dz.name === name)
}

export const getDropZonesByCountry = (country: string): DropZone[] => {
  return DROPZONE_DATABASE.filter((dz) => dz.country === country)
}

export const getDropZonesByContinent = (continent: string): DropZone[] => {
  return DROPZONE_DATABASE.filter((dz) => dz.continent === continent)
}

export const searchDropZones = (query: string): DropZone[] => {
  const lowerQuery = query.toLowerCase()
  return DROPZONE_DATABASE.filter(
    (dz) =>
      dz.name.toLowerCase().includes(lowerQuery) ||
      dz.country.toLowerCase().includes(lowerQuery) ||
      dz.address.toLowerCase().includes(lowerQuery),
  )
}
