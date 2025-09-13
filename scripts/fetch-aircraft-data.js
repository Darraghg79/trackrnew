async function fetchAircraftData() {
  try {
    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Aircraft%20List-IJeXaLieGCuSNriGZp8JjdXNVByXEC.csv",
    )
    const csvText = await response.text()

    console.log("Raw CSV data:")
    console.log(csvText)

    // Parse CSV data
    const lines = csvText.trim().split("\n")
    const headers = lines[0].split(",")
    console.log("Headers:", headers)

    const aircraftList = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",")
      if (values[0] && values[0].trim()) {
        aircraftList.push(values[0].trim())
      }
    }

    console.log("Parsed aircraft list:")
    console.log(aircraftList)
    console.log(`Total aircraft: ${aircraftList.length}`)

    return aircraftList
  } catch (error) {
    console.error("Error fetching aircraft data:", error)
    return []
  }
}

// Execute the function
fetchAircraftData()
