async function processDropzoneData() {
  try {
    console.log("Processing dropzone CSV data...")
    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Dropzone%20list-0RG2fvB1UWm3GUXZRUACUmF2vG81nJ.csv",
    )
    const csvText = await response.text()

    // Parse CSV data
    const lines = csvText.trim().split("\n")
    const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim())

    const dropzones = []
    const dropzoneNames = []

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])

      if (values.length >= 4 && values[0] && values[0].trim()) {
        const name = values[0].replace(/"/g, "").trim()
        const country = values[1] ? values[1].replace(/"/g, "").trim() : ""
        const cityLocation = values[2] ? values[2].replace(/"/g, "").trim() : ""
        const address = values[3] ? values[3].replace(/"/g, "").trim() : ""
        const lat = values[4] ? Number.parseFloat(values[4].replace(/"/g, "").trim()) : null
        const lng = values[5] ? Number.parseFloat(values[5].replace(/"/g, "").trim()) : null
        const elevation = values[6] ? Number.parseFloat(values[6].replace(/"/g, "").trim()) : null

        const continent = getContinent(country)

        // Create full address if not provided
        const fullAddress = address || `${cityLocation}${cityLocation && country ? ", " : ""}${country}`

        const dropzone = {
          id: `dz_${name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
          name: name,
          country: country,
          cityLocation: cityLocation,
          address: fullAddress,
          coordinates: lat && lng && !isNaN(lat) && !isNaN(lng) ? { latitude: lat, longitude: lng } : undefined,
          elevation: elevation && !isNaN(elevation) ? elevation : undefined,
          continent: continent,
          isUserAdded: false,
        }

        dropzones.push(dropzone)
        dropzoneNames.push(name)
      }
    }

    console.log(`✅ Processed ${dropzones.length} dropzones`)
    console.log(`📍 ${dropzones.filter((dz) => dz.coordinates).length} have coordinates`)
    console.log(`🌍 ${new Set(dropzones.map((dz) => dz.continent)).size} continents`)
    console.log(`🏳️ ${new Set(dropzones.map((dz) => dz.country)).size} countries`)

    // Generate the TypeScript data structure
    const tsData = `// Generated dropzone data from CSV
export const DROPZONE_DATABASE: DropZone[] = ${JSON.stringify(dropzones, null, 2)}

export const DROPZONE_NAMES: string[] = ${JSON.stringify(dropzoneNames, null, 2)}

// Statistics
export const DROPZONE_STATS = {
  total: ${dropzones.length},
  withCoordinates: ${dropzones.filter((dz) => dz.coordinates).length},
  continents: ${new Set(dropzones.map((dz) => dz.continent)).size},
  countries: ${new Set(dropzones.map((dz) => dz.country)).size}
}`

    console.log("\n📄 TypeScript data structure generated!")
    console.log("First few dropzones:")
    dropzones.slice(0, 3).forEach((dz) => {
      console.log(`  ${dz.name} (${dz.country}) - ${dz.coordinates ? "HAS COORDS" : "ADDRESS ONLY"}`)
    })

    return { dropzones, dropzoneNames, tsData }
  } catch (error) {
    console.error("Error processing dropzone data:", error)
    return { dropzones: [], dropzoneNames: [], tsData: "" }
  }
}

function parseCSVLine(line) {
  const values = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      values.push(current)
      current = ""
    } else {
      current += char
    }
  }

  values.push(current)
  return values
}

function getContinent(country) {
  const continentMap = {
    // North America
    USA: "North America",
    "United States": "North America",
    Canada: "North America",
    Mexico: "North America",
    Guatemala: "North America",
    Belize: "North America",
    "Costa Rica": "North America",
    Panama: "North America",
    Honduras: "North America",
    Nicaragua: "North America",
    "El Salvador": "North America",

    // South America
    Brazil: "South America",
    Argentina: "South America",
    Chile: "South America",
    Colombia: "South America",
    Peru: "South America",
    Venezuela: "South America",
    Ecuador: "South America",
    Bolivia: "South America",
    Paraguay: "South America",
    Uruguay: "South America",
    Guyana: "South America",
    Suriname: "South America",
    "French Guiana": "South America",

    // Europe
    Germany: "Europe",
    France: "Europe",
    Italy: "Europe",
    Spain: "Europe",
    "United Kingdom": "Europe",
    UK: "Europe",
    Netherlands: "Europe",
    Belgium: "Europe",
    Switzerland: "Europe",
    Austria: "Europe",
    Poland: "Europe",
    "Czech Republic": "Europe",
    Hungary: "Europe",
    Slovakia: "Europe",
    Slovenia: "Europe",
    Croatia: "Europe",
    Serbia: "Europe",
    "Bosnia and Herzegovina": "Europe",
    Montenegro: "Europe",
    Albania: "Europe",
    Macedonia: "Europe",
    Bulgaria: "Europe",
    Romania: "Europe",
    Greece: "Europe",
    Portugal: "Europe",
    Ireland: "Europe",
    Denmark: "Europe",
    Sweden: "Europe",
    Norway: "Europe",
    Finland: "Europe",
    Estonia: "Europe",
    Latvia: "Europe",
    Lithuania: "Europe",
    Russia: "Europe",
    Ukraine: "Europe",
    Belarus: "Europe",
    Moldova: "Europe",

    // Asia
    China: "Asia",
    Japan: "Asia",
    "South Korea": "Asia",
    India: "Asia",
    Thailand: "Asia",
    Vietnam: "Asia",
    Malaysia: "Asia",
    Singapore: "Asia",
    Indonesia: "Asia",
    Philippines: "Asia",
    Taiwan: "Asia",
    "Hong Kong": "Asia",
    UAE: "Asia",
    "United Arab Emirates": "Asia",
    "Saudi Arabia": "Asia",
    Israel: "Asia",
    Turkey: "Asia",
    Iran: "Asia",
    Iraq: "Asia",
    Jordan: "Asia",
    Lebanon: "Asia",
    Syria: "Asia",
    Kuwait: "Asia",
    Qatar: "Asia",
    Bahrain: "Asia",
    Oman: "Asia",
    Yemen: "Asia",
    Afghanistan: "Asia",
    Pakistan: "Asia",
    Bangladesh: "Asia",
    "Sri Lanka": "Asia",
    Nepal: "Asia",
    Bhutan: "Asia",
    Myanmar: "Asia",
    Cambodia: "Asia",
    Laos: "Asia",
    Mongolia: "Asia",
    Kazakhstan: "Asia",
    Uzbekistan: "Asia",
    Turkmenistan: "Asia",
    Kyrgyzstan: "Asia",
    Tajikistan: "Asia",

    // Africa
    "South Africa": "Africa",
    Egypt: "Africa",
    Morocco: "Africa",
    Tunisia: "Africa",
    Algeria: "Africa",
    Libya: "Africa",
    Sudan: "Africa",
    Ethiopia: "Africa",
    Kenya: "Africa",
    Tanzania: "Africa",
    Uganda: "Africa",
    Rwanda: "Africa",
    Burundi: "Africa",
    "Democratic Republic of Congo": "Africa",
    "Republic of Congo": "Africa",
    "Central African Republic": "Africa",
    Chad: "Africa",
    Niger: "Africa",
    Nigeria: "Africa",
    Cameroon: "Africa",
    "Equatorial Guinea": "Africa",
    Gabon: "Africa",
    "São Tomé and Príncipe": "Africa",
    Ghana: "Africa",
    Togo: "Africa",
    Benin: "Africa",
    "Burkina Faso": "Africa",
    Mali: "Africa",
    Senegal: "Africa",
    Mauritania: "Africa",
    Guinea: "Africa",
    "Guinea-Bissau": "Africa",
    "Sierra Leone": "Africa",
    Liberia: "Africa",
    "Ivory Coast": "Africa",
    Zambia: "Africa",
    Zimbabwe: "Africa",
    Botswana: "Africa",
    Namibia: "Africa",
    Angola: "Africa",
    Mozambique: "Africa",
    Madagascar: "Africa",
    Mauritius: "Africa",
    Seychelles: "Africa",
    Comoros: "Africa",
    Djibouti: "Africa",
    Eritrea: "Africa",
    Somalia: "Africa",
    Malawi: "Africa",
    Lesotho: "Africa",
    Swaziland: "Africa",

    // Oceania
    Australia: "Oceania",
    "New Zealand": "Oceania",
    "Papua New Guinea": "Oceania",
    Fiji: "Oceania",
    "Solomon Islands": "Oceania",
    Vanuatu: "Oceania",
    Samoa: "Oceania",
    Tonga: "Oceania",
    Kiribati: "Oceania",
    Tuvalu: "Oceania",
    Nauru: "Oceania",
    Palau: "Oceania",
    "Marshall Islands": "Oceania",
    Micronesia: "Oceania",
  }

  return continentMap[country] || "Unknown"
}

// Execute the processing
processDropzoneData()
