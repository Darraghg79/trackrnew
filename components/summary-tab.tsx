"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { JumpStatistics } from "@/components/jump-statistics"
import { JumpMap } from "@/components/jump-map"
import { WorkReports } from "@/components/work-reports"
import { SummaryIcon } from "@/components/icons/summary-icon"
import { JumpsIcon } from "@/components/icons/jumps-icon"
import { WorkJumpsIcon } from "@/components/icons/work-jumps-icon"
import type { JumpRecord } from "@/types/jump-record"
import type { DropZone } from "@/types/dropzone"
import type { InvoiceSettings } from "@/types/invoice"
import type { AppSettings } from "@/types/settings"

interface SummaryTabProps {
  jumps: JumpRecord[]
  dropZones: DropZone[]
  invoiceSettings: InvoiceSettings
  appSettings: AppSettings
  onWorkJumpsClick?: (workJumps: JumpRecord[]) => void
}

export const SummaryTab: React.FC<SummaryTabProps> = ({
  jumps,
  dropZones,
  invoiceSettings,
  appSettings,
  onWorkJumpsClick,
}) => {
  const [activeView, setActiveView] = useState<"overview" | "statistics" | "map" | "work-reports">("overview")

  // Calculate summary statistics
  const stats = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const jumpsThisMonth = jumps.filter((jump) => {
      const jumpDate = new Date(jump.date)
      return jumpDate.getMonth() === currentMonth && jumpDate.getFullYear() === currentYear
    })

    const workJumps = jumps.filter((jump) => jump.workJump)
    const workJumpsThisMonth = workJumps.filter((jump) => {
      const jumpDate = new Date(jump.date)
      return jumpDate.getMonth() === currentMonth && jumpDate.getFullYear() === currentYear
    })

    const uniqueDropZones = new Set(jumps.map((jump) => jump.dropZone))
    const uniqueAircraft = new Set(jumps.map((jump) => jump.aircraft))

    return {
      totalJumps: jumps.length,
      jumpsThisMonth: jumpsThisMonth.length,
      totalDropZones: uniqueDropZones.size,
      totalAircraft: uniqueAircraft.size,
      totalWorkJumps: workJumps.length,
      workJumpsThisMonth: workJumpsThisMonth.length,
    }
  }, [jumps])

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Dashboard Tiles */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Jumps</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalJumps}</p>
              </div>
              <JumpsIcon className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">{stats.jumpsThisMonth}</p>
              </div>
              <JumpsIcon className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Drop Zones</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDropZones}</p>
              </div>
              <SummaryIcon className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aircraft</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAircraft}</p>
              </div>
              <SummaryIcon className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Work Jumps</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalWorkJumps}</p>
              </div>
              <WorkJumpsIcon className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Work This Month</p>
                <p className="text-2xl font-bold text-gray-900">{stats.workJumpsThisMonth}</p>
              </div>
              <WorkJumpsIcon className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Buttons */}
      <div className="space-y-3">
        <Button
          onClick={() => setActiveView("statistics")}
          className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 justify-start"
          variant="outline"
        >
          <JumpsIcon className="w-5 h-5 mr-3 text-blue-600" />
          Jump Statistics
        </Button>

        <Button
          onClick={() => setActiveView("map")}
          className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 justify-start"
          variant="outline"
        >
          <SummaryIcon className="w-5 h-5 mr-3 text-green-600" />
          Jump Map
        </Button>

        <Button
          onClick={() => setActiveView("work-reports")}
          className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 justify-start"
          variant="outline"
        >
          <WorkJumpsIcon className="w-5 h-5 mr-3 text-red-600" />
          Work Reports
        </Button>
      </div>
    </div>
  )

  const renderStatistics = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Jump Statistics</h2>
        <Button onClick={() => setActiveView("overview")} variant="outline" size="sm">
          ← Back
        </Button>
      </div>
      <JumpStatistics jumps={jumps} appSettings={appSettings} />
    </div>
  )

  const renderMap = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Jump Map</h2>
        <Button onClick={() => setActiveView("overview")} variant="outline" size="sm">
          ← Back
        </Button>
      </div>
      <JumpMap jumps={jumps} dropZones={dropZones} />
    </div>
  )

  const renderWorkReports = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Work Reports</h2>
        <Button onClick={() => setActiveView("overview")} variant="outline" size="sm">
          ← Back
        </Button>
      </div>
      <WorkReports workJumps={jumps.filter((jump) => jump.workJump)} invoiceSettings={invoiceSettings} />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Summary</h1>
        </div>

        {activeView === "overview" && renderOverview()}
        {activeView === "statistics" && renderStatistics()}
        {activeView === "map" && renderMap()}
        {activeView === "work-reports" && renderWorkReports()}
      </div>
    </div>
  )
}
