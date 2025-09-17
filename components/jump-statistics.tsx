"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { JumpRecord } from "@/types/jumpRecord"
import type { DropZone } from "@/types/dropzone"
import type { GearItem } from "@/types/gear"  // ADD THIS IMPORT
import {
  filterJumpsByYear,
  filterJumpsByDropZone,
  filterJumpsByType,
  filterJumpsByAircraft,
  filterJumpsByGear
} from "@/lib/jump-filters"

interface JumpStatisticsProps {
  jumps: JumpRecord[]
  dropZones: DropZone[]
  gearItems: GearItem[]
  onBack: () => void
  onViewJumpList: (jumps: JumpRecord[], title: string) => void
}

interface StatBreakdown {
  label: string
  count: number
  percentage: number
}

export const JumpStatistics: React.FC<JumpStatisticsProps> = ({
  jumps,
  dropZones,
  gearItems,  // ADD THIS TO DESTRUCTURING
  onBack,
  onViewJumpList
}) => {
  const [activeBreakdown, setActiveBreakdown] = useState<string | null>("totalJumps")
  const [totalJumpsView, setTotalJumpsView] = useState<"year" | "dropzone" | "type" | "aircraft" | "gear" | null>(null)

  // Calculate main statistics
  const mainStats = useMemo(() => {
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    const last12Months = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())

    const jumpsLastMonth = jumps.filter((jump) => new Date(jump.date) >= lastMonth).length
    const jumpsLast12Months = jumps.filter((jump) => new Date(jump.date) >= last12Months).length

    const lastJumpDate =
      jumps.length > 0 ? new Date(Math.max(...jumps.map((jump) => new Date(jump.date).getTime()))) : null

    return {
      totalJumps: jumps.length,
      jumpsLastMonth,
      jumpsLast12Months,
      lastJumpDate,
    }
  }, [jumps])

  // Calculate breakdowns for total jumps
  const totalJumpsBreakdowns = useMemo(() => {
    const breakdowns: Record<string, StatBreakdown[]> = {}

    // By Year
    const yearCounts: Record<string, number> = {}
    jumps.forEach((jump) => {
      const year = new Date(jump.date).getFullYear().toString()
      yearCounts[year] = (yearCounts[year] || 0) + 1
    })
    breakdowns.year = Object.entries(yearCounts)
      .map(([year, count]) => ({
        label: year,
        count,
        percentage: (count / jumps.length) * 100,
      }))
      .sort((a, b) => b.label.localeCompare(a.label))

    // By Drop Zone
    const dropZoneCounts: Record<string, number> = {}
    jumps.forEach((jump) => {
      dropZoneCounts[jump.dropZone] = (dropZoneCounts[jump.dropZone] || 0) + 1
    })
    breakdowns.dropzone = Object.entries(dropZoneCounts)
      .map(([dz, count]) => ({
        label: dz,
        count,
        percentage: (count / jumps.length) * 100,
      }))
      .sort((a, b) => b.count - a.count)

    // By Jump Type
    const typeCounts: Record<string, number> = {}
    jumps.forEach((jump) => {
      typeCounts[jump.jumpType] = (typeCounts[jump.jumpType] || 0) + 1
    })
    breakdowns.type = Object.entries(typeCounts)
      .map(([type, count]) => ({
        label: type,
        count,
        percentage: (count / jumps.length) * 100,
      }))
      .sort((a, b) => b.count - a.count)

    // By Aircraft
    const aircraftCounts: Record<string, number> = {}
    jumps.forEach((jump) => {
      aircraftCounts[jump.aircraft] = (aircraftCounts[jump.aircraft] || 0) + 1
    })
    breakdowns.aircraft = Object.entries(aircraftCounts)
      .map(([aircraft, count]) => ({
        label: aircraft,
        count,
        percentage: (count / jumps.length) * 100,
      }))
      .sort((a, b) => b.count - a.count)

    // By Gear (with reserve canopy cutaway logic and previous jumps)
    const gearCounts: Record<string, number> = {}

    // First, add previous jumps for all gear items
    gearItems?.forEach((gearItem) => {
      if (gearItem.previousJumps > 0) {
        // For reserve canopies, we don't add previous jumps to the count
        // (assuming previous jumps on reserve means actual deployments)
        if (gearItem.type !== 'reserve') {
          gearCounts[gearItem.name] = gearItem.previousJumps
        }
      }
    })

    // Then count jumps from the log
    jumps.forEach((jump) => {
      if (jump.gearUsed && Array.isArray(jump.gearUsed)) {
        jump.gearUsed.forEach((gearName) => {
          // Check if this is a reserve canopy
          const gearItem = gearItems?.find(item => item.name === gearName)

          // If it's a reserve canopy, only count if there was a cutaway
          if (gearItem?.type === 'reserve') {
            if (jump.cutaway === true) {
              gearCounts[gearName] = (gearCounts[gearName] || 0) + 1
            }
          } else {
            // For all other gear types, count normally
            gearCounts[gearName] = (gearCounts[gearName] || 0) + 1
          }
        })
      }
    })

    // Convert gear counts to breakdown format
    breakdowns.gear = Object.entries(gearCounts)
      .map(([gear, count]) => ({
        label: gear,
        count,
        percentage: jumps.length > 0 ? (count / jumps.length) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return breakdowns
  }, [jumps, gearItems])  // ADD gearItems to dependencies

  const getBreakdownTitle = (view: string) => {
    switch (view) {
      case "year":
        return "Total Jumps by Year"
      case "dropzone":
        return "Total Jumps by Drop Zone"
      case "type":
        return "Total Jumps by Type"
      case "aircraft":
        return "Total Jumps by Aircraft"
      case "gear":
        return "Total Jumps by Gear Used"
      default:
        return "Total Jumps Breakdown"
    }
  }

  const handleBreakdownViewSelect = (view: "year" | "dropzone" | "type" | "aircraft" | "gear") => {
    setTotalJumpsView(view)
  }

  const renderTotalJumpsBreakdown = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Total Jumps Breakdown</h2>
        <Button variant="ghost" onClick={onBack} className="text-blue-600 hover:text-blue-800">
          ← Back
        </Button>
      </div>

      {!totalJumpsView ? (
        <div className="space-y-3">
          <p className="text-gray-600 mb-4">Choose how to view your {mainStats.totalJumps} total jumps:</p>

          {[
            { key: "year", label: "By Year", description: "See jumps grouped by year" },
            { key: "dropzone", label: "By Drop Zone", description: "See jumps by location" },
            { key: "type", label: "By Jump Type", description: "Tandem, AFF, Formation, etc." },
            { key: "aircraft", label: "By Aircraft", description: "See which aircraft you've jumped from" },
            { key: "gear", label: "By Gear Used", description: "Your most used gear items" },
          ].map((option) => (
            <button
              key={option.key}
              onClick={() => handleBreakdownViewSelect(option.key as any)}
              className="w-full p-4 text-left border rounded-md hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium text-gray-900">{option.label}</div>
              <div className="text-sm text-gray-600">{option.description}</div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{getBreakdownTitle(totalJumpsView)}</h3>
            <Button
              variant="ghost"
              onClick={() => setTotalJumpsView(null)}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Change View
            </Button>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                {totalJumpsBreakdowns[totalJumpsView]?.map((item, index) => (
                  <div
                    key={item.label}
                    className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      let filtered: JumpRecord[] = []
                      let title = ""

                      switch (totalJumpsView) {
                        case "year":
                          filtered = filterJumpsByYear(jumps, item.label)
                          title = `Jumps in ${item.label}`
                          break
                        case "dropzone":
                          filtered = filterJumpsByDropZone(jumps, item.label)
                          title = `Jumps at ${item.label}`
                          break
                        case "type":
                          filtered = filterJumpsByType(jumps, item.label)
                          title = `${item.label} Jumps`
                          break
                        case "aircraft":
                          filtered = filterJumpsByAircraft(jumps, item.label)
                          title = `Jumps from ${item.label}`
                          break
                        case "gear":
                          filtered = filterJumpsByGear(jumps, item.label)
                          title = `Jumps using ${item.label}`
                          break
                      }

                      onViewJumpList(filtered, title)
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-500 w-6 text-center">#{index + 1}</span>
                      <span className="font-medium text-gray-900">{item.label}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900 hover:text-blue-600">{item.count} jumps</div>
                      <div className="text-sm text-gray-500">{item.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>

              {totalJumpsBreakdowns[totalJumpsView]?.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No data available for this breakdown</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {renderTotalJumpsBreakdown()}
    </div>
  )
}