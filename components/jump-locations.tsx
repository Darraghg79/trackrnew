"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight, ArrowLeft } from "lucide-react"
import type { JumpRecord } from "@/types/jumpRecord"
import type { DropZone } from "@/types/dropzone"
import { filterJumpsByCountry, filterJumpsByDropZone } from "@/lib/jump-filters"

interface JumpLocationsProps {
  jumps: JumpRecord[]
  dropZones: DropZone[]
  onBack: () => void
  onViewJumpList: (jumps: JumpRecord[], title: string) => void
}

export const JumpLocations: React.FC<JumpLocationsProps> = ({ 
  jumps, 
  dropZones, 
  onBack,
  onViewJumpList 
}) => {
  const [view, setView] = useState<"summary" | "countries" | "dropzones" | "map">("summary")
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)

  const locationStats = useMemo(() => {
    const countryMap = new Map<string, number>()
    const dropZoneMap = new Map<string, number>()
    const countryDropZones = new Map<string, Set<string>>()

    jumps.forEach(j => {
      // Always count the dropzone from the jump
      if (j.dropZone) {
        dropZoneMap.set(j.dropZone, (dropZoneMap.get(j.dropZone) || 0) + 1)
      }

      // Try to find metadata for this dropzone
      const dz = dropZones.find(d => d.name === j.dropZone)
      
      if (dz && dz.country) {
        // If we have country data, count it
        countryMap.set(dz.country, (countryMap.get(dz.country) || 0) + 1)
        
        if (!countryDropZones.has(dz.country)) {
          countryDropZones.set(dz.country, new Set())
        }
        countryDropZones.get(dz.country)?.add(j.dropZone)
      } else if (!dz) {
        // If no metadata, put in "Unknown" country
        const unknownCountry = "Unknown"
        countryMap.set(unknownCountry, (countryMap.get(unknownCountry) || 0) + 1)
        
        if (!countryDropZones.has(unknownCountry)) {
          countryDropZones.set(unknownCountry, new Set())
        }
        countryDropZones.get(unknownCountry)?.add(j.dropZone)
      }
    })

    return {
      countries: countryMap,
      dropZones: dropZoneMap,
      countryDropZones,
      totalCountries: countryMap.size,
      totalDropZones: dropZoneMap.size
    }
  }, [jumps, dropZones])

  if (view === "summary") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Jump Locations</h2>
          <Button onClick={onBack} variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setView("countries")}
          >
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {locationStats.totalCountries}
                </p>
                <p className="text-sm text-gray-600">Countries</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setView("dropzones")}
          >
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {locationStats.totalDropZones}
                </p>
                <p className="text-sm text-gray-600">Dropzones</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setView("map")}
          >
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  🗺️
                </p>
                <p className="text-sm text-gray-600">Jump Map (WIP)</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (view === "countries") {
    const countryList = Array.from(locationStats.countries.entries())
      .sort((a, b) => b[1] - a[1])

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Countries</h2>
          <Button 
            onClick={() => setView("summary")} 
            variant="ghost" 
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>

        <div className="space-y-2">
          {countryList.length > 0 ? (
            countryList.map(([country, count]) => (
              <Card 
                key={country}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedCountry(country)
                  setView("dropzones")
                }}
              >
                <CardContent className="p-3 flex justify-between items-center">
                  <span className="font-medium">{country}</span>
                  <button
                    className="flex items-center gap-2 hover:bg-gray-100 px-2 py-1 rounded"
                    onClick={(e) => {
                      e.stopPropagation()
                      const filtered = country === "Unknown" 
                        ? jumps.filter(j => !dropZones.find(dz => dz.name === j.dropZone)?.country)
                        : filterJumpsByCountry(jumps, country, dropZones)
                      onViewJumpList(filtered, `Jumps in ${country}`)
                    }}
                  >
                    <span className="text-lg font-bold text-green-600">{count}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-4 text-center text-gray-500">
                No countries recorded
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }

  if (view === "dropzones") {
    let dropZoneList: [string, number][] = []
    
    if (selectedCountry) {
      const dzs = locationStats.countryDropZones.get(selectedCountry) || new Set()
      dropZoneList = Array.from(dzs)
        .map(dz => [dz, locationStats.dropZones.get(dz) || 0])
        .sort((a, b) => b[1] - a[1])
    } else {
      dropZoneList = Array.from(locationStats.dropZones.entries())
        .sort((a, b) => b[1] - a[1])
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            {selectedCountry ? `${selectedCountry} Drop Zones` : "Drop Zones"}
          </h2>
          <Button 
            onClick={() => {
              if (selectedCountry) {
                setSelectedCountry(null)
                setView("countries")
              } else {
                setView("summary")
              }
            }} 
            variant="ghost" 
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>

        <div className="space-y-2">
          {dropZoneList.length > 0 ? (
            dropZoneList.map(([dz, count]) => (
              <Card 
                key={dz}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  const filtered = filterJumpsByDropZone(jumps, dz)
                  onViewJumpList(filtered, `Jumps at ${dz}`)
                }}
              >
                <CardContent className="p-3 flex justify-between items-center">
                  <span className="font-medium">{dz}</span>
                  <span className="text-lg font-bold text-purple-600">{count}</span>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-4 text-center text-gray-500">
                No drop zones recorded
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }

  if (view === "map") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Jump Map (WIP)</h2>
          <Button 
            onClick={() => setView("summary")} 
            variant="ghost" 
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>

        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Map View Coming Soon</h3>
            <p className="text-sm text-gray-500">
              This feature will display your jump locations on an interactive map.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}