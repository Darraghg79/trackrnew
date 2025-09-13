"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { JumpRecord } from "@/types/jump-record"
import type { DropZone, DropZoneJumpStats, LocationCluster } from "@/types/dropzone"

interface JumpMapProps {
  jumps: JumpRecord[]
  dropZones: DropZone[]
}

export const JumpMap: React.FC<JumpMapProps> = ({ jumps, dropZones }) => {
  const [mapLevel, setMapLevel] = useState<"continent" | "country" | "dropzone">("continent")
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showOnlyVisited, setShowOnlyVisited] = useState(false)

  // Calculate jump statistics by location
  const jumpStats = useMemo(() => {
    const stats: Record<string, DropZoneJumpStats> = {}
    const totalJumps = jumps.length

    jumps.forEach((jump) => {
      const dropZone = dropZones.find((dz) => dz.name === jump.dropZone)
      if (dropZone) {
        if (!stats[dropZone.id]) {
          stats[dropZone.id] = {
            dropZoneId: dropZone.id,
            dropZoneName: dropZone.name,
            jumpCount: 0,
            percentage: 0,
            coordinates: dropZone.coordinates,
            address: dropZone.address,
          }
        }
        stats[dropZone.id].jumpCount++
      }
    })

    // Calculate percentages
    Object.values(stats).forEach((stat) => {
      stat.percentage = totalJumps > 0 ? (stat.jumpCount / totalJumps) * 100 : 0
    })

    return Object.values(stats)
  }, [jumps, dropZones])

  // Group statistics by continent/country
  const locationClusters = useMemo(() => {
    const continents: Record<string, LocationCluster> = {}

    jumpStats.forEach((stat) => {
      const dropZone = dropZones.find((dz) => dz.id === stat.dropZoneId)
      if (!dropZone) return

      const continent = dropZone.continent || "Unknown"
      const country = dropZone.country || "Unknown"

      // Initialize continent
      if (!continents[continent]) {
        continents[continent] = {
          level: "continent",
          name: continent,
          jumpCount: 0,
          percentage: 0,
          children: [],
        }
      }

      // Find or create country
      let countryCluster = continents[continent].children?.find((c) => c.name === country)
      if (!countryCluster) {
        countryCluster = {
          level: "country",
          name: country,
          jumpCount: 0,
          percentage: 0,
          children: [],
        }
        continents[continent].children?.push(countryCluster)
      }

      // Add dropzone
      countryCluster.children?.push({
        level: "dropzone",
        name: stat.dropZoneName,
        jumpCount: stat.jumpCount,
        percentage: stat.percentage,
        coordinates: stat.coordinates,
      })

      // Update parent counts
      countryCluster.jumpCount += stat.jumpCount
      continents[continent].jumpCount += stat.jumpCount
    })

    // Calculate percentages for continents and countries
    const totalJumps = jumps.length
    Object.values(continents).forEach((continent) => {
      continent.percentage = totalJumps > 0 ? (continent.jumpCount / totalJumps) * 100 : 0
      continent.children?.forEach((country) => {
        country.percentage = totalJumps > 0 ? (country.jumpCount / totalJumps) * 100 : 0
      })
    })

    return Object.values(continents)
  }, [jumpStats, dropZones, jumps.length])

  // Simulate map loading (in real implementation, this would be when Leaflet loads)
  useEffect(() => {
    const timer = setTimeout(() => setIsMapLoaded(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  const getCurrentLevelData = () => {
    let data = []

    if (mapLevel === "continent") {
      data = locationClusters
    } else if (mapLevel === "country" && selectedLocation) {
      const continent = locationClusters.find((c) => c.name === selectedLocation)
      data = continent?.children || []
    } else if (mapLevel === "dropzone" && selectedLocation) {
      for (const continent of locationClusters) {
        const country = continent.children?.find((c) => c.name === selectedLocation)
        if (country) {
          data = country.children || []
          break
        }
      }
    }

    // Apply search filter
    if (searchQuery) {
      data = data.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    // Apply visited filter
    if (showOnlyVisited) {
      data = data.filter((item) => item.jumpCount > 0)
    }

    return data
  }

  const handleLocationClick = (location: LocationCluster) => {
    if (location.level === "continent" && location.children && location.children.length > 0) {
      setMapLevel("country")
      setSelectedLocation(location.name)
    } else if (location.level === "country" && location.children && location.children.length > 0) {
      setMapLevel("dropzone")
      setSelectedLocation(location.name)
    }
  }

  const handleBackClick = () => {
    if (mapLevel === "dropzone") {
      setMapLevel("country")
    } else if (mapLevel === "country") {
      setMapLevel("continent")
      setSelectedLocation(null)
    }
  }

  const getMarkerColor = (percentage: number) => {
    if (percentage >= 50) return "bg-red-500"
    if (percentage >= 20) return "bg-orange-500"
    if (percentage >= 5) return "bg-yellow-500"
    return "bg-blue-500"
  }

  const currentData = getCurrentLevelData()

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center mb-2">
            <CardTitle>Jump Locations Map</CardTitle>
            {mapLevel !== "continent" && (
              <Button onClick={handleBackClick} variant="outline" className="text-sm bg-transparent">
                ← Back to {mapLevel === "dropzone" ? "Countries" : "Continents"}
              </Button>
            )}
          </div>
          <div className="flex items-center space-x-2 mb-2">
            <Input
              placeholder="Search locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-sm"
            />
            <Button
              onClick={() => setShowOnlyVisited(!showOnlyVisited)}
              variant={showOnlyVisited ? "default" : "outline"}
              className="text-xs px-2 py-1 bg-transparent"
            >
              {showOnlyVisited ? "All" : "Visited"}
            </Button>
          </div>
          <div className="text-sm text-gray-600">
            Viewing:{" "}
            {mapLevel === "continent"
              ? "Continents"
              : mapLevel === "country"
                ? `Countries in ${selectedLocation}`
                : `Drop Zones in ${selectedLocation}`}
          </div>
        </CardHeader>
        <CardContent>
          {/* Enhanced Map Container */}
          <div className="relative w-full h-80 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center mb-4">
            {!isMapLoaded ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading satellite map...</p>
              </div>
            ) : (
              <div className="text-center w-full h-full flex flex-col justify-center">
                <div className="mb-4">
                  <p className="text-gray-600 mb-2">🛰️ Interactive Satellite Map</p>
                  <p className="text-sm text-gray-500 mb-4">Jump locations with activity levels</p>
                </div>

                {/* Enhanced Map Visualization */}
                <div className="relative w-full h-40 bg-gradient-to-b from-blue-200 to-green-200 rounded-lg mb-4 overflow-hidden">
                  {/* Simulate world map background */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="w-full h-full bg-gradient-to-r from-green-300 via-yellow-200 to-blue-300"></div>
                  </div>

                  {/* Plot location markers */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="grid grid-cols-6 gap-4 w-full h-full p-4">
                      {currentData.slice(0, 6).map((location, index) => {
                        const positions = [
                          { top: "20%", left: "15%" }, // Europe
                          { top: "40%", left: "85%" }, // Asia
                          { top: "60%", left: "20%" }, // Africa
                          { top: "30%", left: "75%" }, // North America
                          { top: "70%", left: "70%" }, // South America
                          { top: "80%", left: "90%" }, // Oceania
                        ]
                        const position = positions[index] || { top: "50%", left: "50%" }

                        return (
                          <div
                            key={location.name}
                            className={`absolute w-4 h-4 rounded-full ${getMarkerColor(location.percentage)} cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-125 transition-transform shadow-lg border-2 border-white`}
                            style={{ top: position.top, left: position.left }}
                            title={`${location.name}: ${location.jumpCount} jumps (${location.percentage.toFixed(1)}%)`}
                            onClick={() => handleLocationClick(location)}
                          />
                        )
                      })}
                    </div>
                  </div>

                  {/* Map controls overlay */}
                  <div className="absolute bottom-2 right-2 bg-white bg-opacity-90 rounded px-2 py-1 text-xs">
                    <span className="text-gray-600">Click markers to zoom</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Location Statistics */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">
              {mapLevel.charAt(0).toUpperCase() + mapLevel.slice(1)} Statistics
            </h4>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
              {currentData.map((location) => (
                <div
                  key={location.name}
                  onClick={() => handleLocationClick(location)}
                  className={`p-3 border rounded-md transition-colors ${
                    location.children && location.children.length > 0
                      ? "cursor-pointer hover:bg-gray-50 border-gray-300"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-3 h-3 rounded-full ${getMarkerColor(location.percentage)}`}
                        title={`${location.percentage.toFixed(1)}% of total jumps`}
                      />
                      <div>
                        <span className="font-medium text-gray-900">{location.name}</span>
                        {location.children && location.children.length > 0 && (
                          <span className="ml-2 text-xs text-gray-500">
                            ({location.children.length} {location.level === "continent" ? "countries" : "locations"})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{location.jumpCount} jumps</div>
                      <div className="text-sm text-gray-500">{location.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Activity Level</h5>
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span>50%+ (High)</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                <span>20-50% (Medium)</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span>5-20% (Low)</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>{"<5%"} (Minimal)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Jump Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{locationClusters.length}</div>
              <div className="text-sm text-gray-600">Continents Visited</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {locationClusters.reduce((sum, c) => sum + (c.children?.length || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Countries Visited</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{jumpStats.length}</div>
              <div className="text-sm text-gray-600">Drop Zones</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{jumps.length}</div>
              <div className="text-sm text-gray-600">Total Jumps</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
