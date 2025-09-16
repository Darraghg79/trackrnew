"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight, ArrowLeft } from "lucide-react"
import type { JumpRecord, RateAtTimeOfJump } from "@/types/jumpRecord"
import type { InvoiceSettings } from "@/types/invoice"

interface WorkReportsProps {
  workJumps: JumpRecord[]
  invoiceSettings: InvoiceSettings
  onBack: () => void
  onViewJumpList?: (jumps: JumpRecord[], title: string) => void
}

export const WorkReports: React.FC<WorkReportsProps> = ({ 
  workJumps, 
  invoiceSettings, 
  onBack, 
  onViewJumpList 
}) => {
  const [viewMode, setViewMode] = useState<"count" | "revenue">("count")
  const [showMonthlyChart, setShowMonthlyChart] = useState(false)

  const stats = useMemo(() => {
    const total = workJumps.length
    
    const totalRevenue = workJumps.reduce((sum, jump) => {
      const jumpValue = (jump.invoiceItems || []).reduce((itemSum, item) => {
        const storedRate = jump.rateAtTimeOfJump?.find((r) => r.service === item)?.rate
        return itemSum + (storedRate || invoiceSettings.rates[item] || 0)
      }, 0)
      return sum + jumpValue
    }, 0)

    // By Jump Type
    const byType = new Map<string, { count: number; revenue: number }>()
    workJumps.forEach(jump => {
      const type = jump.jumpType || "Unknown"
      const current = byType.get(type) || { count: 0, revenue: 0 }
      const jumpRevenue = (jump.invoiceItems || []).reduce((sum, item) => {
        const storedRate = jump.rateAtTimeOfJump?.find((r) => r.service === item)?.rate
        return sum + (storedRate || invoiceSettings.rates[item] || 0)
      }, 0)
      byType.set(type, {
        count: current.count + 1,
        revenue: current.revenue + jumpRevenue
      })
    })

    // By Service
    const byService = new Map<string, { count: number; revenue: number }>()
    workJumps.forEach(jump => {
      (jump.invoiceItems || []).forEach(service => {
        const current = byService.get(service) || { count: 0, revenue: 0 }
        const storedRate = jump.rateAtTimeOfJump?.find((r) => r.service === service)?.rate
        const serviceRevenue = storedRate || invoiceSettings.rates[service] || 0
        byService.set(service, {
          count: current.count + 1,
          revenue: current.revenue + serviceRevenue
        })
      })
    })

    // Monthly data
    const monthlyData = []
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const monthName = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })

      const monthJumps = workJumps.filter((jump) => {
        const jumpDate = jump.date instanceof Date ? jump.date : new Date(jump.date)
        const jumpMonthKey = `${jumpDate.getFullYear()}-${String(jumpDate.getMonth() + 1).padStart(2, "0")}`
        return jumpMonthKey === monthKey
      })

      const count = monthJumps.length
      const revenue = monthJumps.reduce((sum, jump) => {
        const jumpValue = (jump.invoiceItems || []).reduce((itemSum, item) => {
          const storedRate = jump.rateAtTimeOfJump?.find((r) => r.service === item)?.rate
          return itemSum + (storedRate || invoiceSettings.rates[item] || 0)
        }, 0)
        return sum + jumpValue
      }, 0)

      monthlyData.push({ month: monthName, count, revenue })
    }

    return {
      total,
      totalRevenue,
      byType: Array.from(byType.entries()).sort((a, b) => b[1].count - a[1].count),
      byService: Array.from(byService.entries()).sort((a, b) => b[1].count - a[1].count),
      monthlyData
    }
  }, [workJumps, invoiceSettings])

  const formatCurrency = (amount: number) => {
    return `${invoiceSettings.currency}${amount.toFixed(0)}`
  }

  const handleViewTotal = () => {
    if (onViewJumpList) {
      onViewJumpList(workJumps, "All Work Jumps")
    }
  }

  const handleViewByType = (type: string) => {
    if (onViewJumpList) {
      const filtered = workJumps.filter(j => j.jumpType === type)
      onViewJumpList(filtered, `${type} Work Jumps`)
    }
  }

  const handleViewByService = (service: string) => {
    if (onViewJumpList) {
      const filtered = workJumps.filter(j => j.invoiceItems?.includes(service))
      onViewJumpList(filtered, `${service} Work Jumps`)
    }
  }

  if (showMonthlyChart) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Last 12 Months</h2>
          <Button onClick={() => setShowMonthlyChart(false)} variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>

        <div className="flex gap-2 mb-4">
          <Button
            variant={viewMode === "count" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("count")}
          >
            Count
          </Button>
          <Button
            variant={viewMode === "revenue" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("revenue")}
          >
            Revenue
          </Button>
        </div>

        <div className="space-y-2">
          {stats.monthlyData.map(month => {
            const value = viewMode === "count" ? month.count : month.revenue
            const maxValue = Math.max(...stats.monthlyData.map(m => 
              viewMode === "count" ? m.count : m.revenue
            ))
            const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0

            return (
              <div key={month.month} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{month.month}</span>
                  <span className="font-medium">
                    {viewMode === "count" ? value : formatCurrency(value)}
                  </span>
                </div>
                <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Work Reports</h2>
        <Button onClick={onBack} variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant={viewMode === "count" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("count")}
          className="flex-1"
        >
          Count
        </Button>
        <Button
          variant={viewMode === "revenue" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("revenue")}
          className="flex-1"
        >
          Revenue
        </Button>
      </div>

      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={handleViewTotal}
      >
        <CardContent className="p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">
            {viewMode === "count" ? stats.total : formatCurrency(stats.totalRevenue)}
          </p>
          <p className="text-sm text-gray-600">
            Total Work {viewMode === "count" ? "Jumps" : "Revenue"}
          </p>
          <p className="text-xs text-blue-600 mt-2">Click to view all →</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-3">By Jump Type</h3>
          <div className="space-y-2">
            {stats.byType.map(([type, data]) => {
              const value = viewMode === "count" ? data.count : data.revenue
              const maxValue = Math.max(...stats.byType.map(([_, d]) => 
                viewMode === "count" ? d.count : d.revenue
              ))
              const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0

              return (
                <div 
                  key={type} 
                  className="cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                  onClick={() => handleViewByType(type)}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{type}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">
                        {viewMode === "count" ? value : formatCurrency(value)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-600 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-3">By Service</h3>
          <div className="space-y-2">
            {stats.byService.map(([service, data]) => {
              const value = viewMode === "count" ? data.count : data.revenue
              const maxValue = Math.max(...stats.byService.map(([_, d]) => 
                viewMode === "count" ? d.count : d.revenue
              ))
              const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0

              return (
                <div 
                  key={service} 
                  className="cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                  onClick={() => handleViewByService(service)}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{service}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">
                        {viewMode === "count" ? value : formatCurrency(value)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-600 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={() => setShowMonthlyChart(true)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        View Last 12 Months →
      </Button>
    </div>
  )
}