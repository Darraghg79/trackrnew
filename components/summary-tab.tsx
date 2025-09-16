"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight, ArrowLeft } from "lucide-react"
import type { JumpRecord } from "@/types/jumpRecord"
import type { DropZone } from "@/types/dropzone"
import type { InvoiceSettings } from "@/types/invoice"
import { Dashboard } from "@/components/dashboard"
import { JumpStatistics } from "@/components/jump-statistics"
import { JumpLocations } from "@/components/jump-locations"
import { WorkReports } from "@/components/work-reports"
import { JumpListView } from "@/components/jump-list-view"

// Import AppSettings from your types or define here
interface AppSettings {
  units: string
  dateFormat: string
  theme: string
  currentJumpNumber: number
  currentFreefallTime: number
  freefallTimeAuditLog?: any[]
  jumpCountAuditLog?: any[]
  instructorInfo: {
    name: string
    address: string
  }
}

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
  const [activeView, setActiveView] = useState <
    "dashboard" | "reports" | "statistics" | "locations" | "work" | "jumplist"
  >("dashboard")
  const [previousView, setPreviousView] = useState<
    "dashboard" | "reports" | "statistics" | "locations" | "work"
  >("reports")
  const [filteredJumps, setFilteredJumps] = useState<JumpRecord[]>([])
  const [jumpListTitle, setJumpListTitle] = useState("")

  const changeView = (newView: "dashboard" | "reports" | "statistics" | "locations" | "work" | "jumplist") => {
    if (newView !== "jumplist") {
      setPreviousView(activeView as any)
    }
    setActiveView(newView)
  }

  const handleViewJumpList = (jumps: JumpRecord[], title: string) => {
    // Store current view before switching to jumplist
    setPreviousView(activeView as any)
    setFilteredJumps(jumps)
    setJumpListTitle(title)
    setActiveView("jumplist")
  }

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <Dashboard
            jumps={jumps}
            appSettings={appSettings}
            onNavigateToReports={() => changeView("reports")}
            onViewJumpList={handleViewJumpList}
          />
        )

      case "reports":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Reports</h2>
              <Button onClick={() => changeView("dashboard")} variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => changeView("statistics")}
              onKeyDown={(e) => e.key === 'Enter' && changeView("statistics")}
              className="cursor-pointer"
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <h3 className="font-medium text-blue-600">Jump Statistics</h3>
                  <p className="text-sm text-gray-600">View jumps by year, location, type, and more</p>
                </CardContent>
              </Card>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => changeView("locations")}
              onKeyDown={(e) => e.key === 'Enter' && changeView("locations")}
              className="cursor-pointer"
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <h3 className="font-medium text-green-600">Jump Locations</h3>
                  <p className="text-sm text-gray-600">Explore your jumps by continent, country, and dropzone</p>
                </CardContent>
              </Card>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => changeView("work")}
              onKeyDown={(e) => e.key === 'Enter' && changeView("work")}
              className="cursor-pointer"
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <h3 className="font-medium text-purple-600">Work Reports</h3>
                  <p className="text-sm text-gray-600">Analyze your work jumps and revenue</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case "statistics":
        return (
          <JumpStatistics
            jumps={jumps}
            dropZones={dropZones}
            onBack={() => changeView("reports")}
            onViewJumpList={handleViewJumpList}
          />
        )

      case "locations":
        return (
          <JumpLocations
            jumps={jumps}
            dropZones={dropZones}
            onBack={() => changeView("reports")}
            onViewJumpList={handleViewJumpList}
          />
        )

      case "work":
        return (
          <WorkReports
            workJumps={jumps.filter(j => j.workJump)}
            invoiceSettings={invoiceSettings}
            onBack={() => changeView("reports")}
            onViewJumpList={handleViewJumpList}
          />
        )

      case "jumplist":
        return (
          <JumpListView
            jumps={filteredJumps}
            title={jumpListTitle}
            onBack={() => setActiveView(previousView)}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {activeView === "dashboard" ? "Summary" :
              activeView === "reports" ? "Reports" :
                ""}
          </h1>
          <div className="flex gap-2">
            <Button
              variant={activeView.includes("dashboard") ? "default" : "outline"}
              size="sm"
              onClick={() => changeView("dashboard")}
            >
              Dashboard
            </Button>
            <Button
              variant={activeView !== "dashboard" ? "default" : "outline"}
              size="sm"
              onClick={() => changeView("reports")}
            >
              Reports
            </Button>
          </div>
        </div>

        {renderContent()}
      </div>
    </div>
  )
}