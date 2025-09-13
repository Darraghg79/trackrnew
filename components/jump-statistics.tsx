"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { JumpRecord } from "@/types/jump-record"
import type { DropZone } from "@/types/dropzone"

interface JumpStatisticsProps {
  jumps: JumpRecord[]
  dropZones: DropZone[]
}

interface StatBreakdown {
  label: string
  count: number
  percentage: number
}

export const JumpStatistics: React.FC<JumpStatisticsProps> = ({ jumps, dropZones }) => {
  const [activeBreakdown, setActiveBreakdown] = useState<string | null>(null)
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

    // By Gear (most used gear items)
    const gearCounts: Record<string, number> = {}
    jumps.forEach((jump) => {
  if (jump.gearUsed && Array.isArray(jump.gearUsed)) {  // ← CHECK FIRST
    jump.gearUsed.forEach((gear) => {
      gearCounts[gear] = (gearCounts[gear] || 0) + 1
    })
  }
})
    breakdowns.gear = Object.entries(gearCounts)
      .map(([gear, count]) => ({
        label: gear,
        count,
        percentage: (count / jumps.length) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Top 10 gear items

    return breakdowns
  }, [jumps])

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

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

  const handleTotalJumpsClick = () => {
    setActiveBreakdown("totalJumps")
    setTotalJumpsView(null)
  }

  const handleBreakdownViewSelect = (view: "year" | "dropzone" | "type" | "aircraft" | "gear") => {
    setTotalJumpsView(view)
  }

  const renderMainStats = () => (
    <div className="space-y-4">
      {/* Total Jumps - Clickable */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <button onClick={handleTotalJumpsClick} className="w-full text-left">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Total Jumps</h3>
                <p className="text-sm text-gray-600">Click to view breakdown</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">{mainStats.totalJumps}</div>
                <div className="text-sm text-blue-500">→</div>
              </div>
            </div>
          </button>
        </CardContent>
      </Card>

      {/* Jumps Last Month */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Jumps Last Month</h3>
              <p className="text-sm text-gray-600">Last 30 days</p>
            </div>
            <div className="text-3xl font-bold text-green-600">{mainStats.jumpsLastMonth}</div>
          </div>
        </CardContent>
      </Card>

      {/* Jumps Last 12 Months */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Jumps Last 12 Months</h3>
              <p className="text-sm text-gray-600">Rolling 12 months</p>
            </div>
            <div className="text-3xl font-bold text-purple-600">{mainStats.jumpsLast12Months}</div>
          </div>
        </CardContent>
      </Card>

      {/* Last Jump Date */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Last Jump Date</h3>
              <p className="text-sm text-gray-600">Most recent jump</p>
            </div>
            <div className="text-right">
              {mainStats.lastJumpDate ? (
                <>
                  <div className="text-lg font-bold text-orange-600">{formatDate(mainStats.lastJumpDate)}</div>
                  <div className="text-sm text-gray-500">
                    {Math.floor((Date.now() - mainStats.lastJumpDate.getTime()) / (1000 * 60 * 60 * 24))} days ago
                  </div>
                </>
              ) : (
                <div className="text-lg font-bold text-gray-400">No jumps yet</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderTotalJumpsBreakdown = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Total Jumps Breakdown</h2>
        <Button variant="ghost" onClick={() => setActiveBreakdown(null)} className="text-blue-600 hover:text-blue-800">
          ← Back to Stats
        </Button>
      </div>

      {!totalJumpsView ? (
        // Breakdown selection
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
        // Show selected breakdown
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
                    className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-500 w-6 text-center">#{index + 1}</span>
                      <span className="font-medium text-gray-900">{item.label}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{item.count} jumps</div>
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
      {!activeBreakdown && renderMainStats()}
      {activeBreakdown === "totalJumps" && renderTotalJumpsBreakdown()}
    </div>
  )
}
