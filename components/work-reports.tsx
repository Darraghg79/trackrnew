"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { JumpRecord } from "@/types/jump-record"
import type { InvoiceSettings } from "@/types/invoice"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface WorkReportsProps {
  workJumps: JumpRecord[]
  invoiceSettings: InvoiceSettings
  onWorkJumpsClick: (workJumps: JumpRecord[]) => void
}

export const WorkReports: React.FC<WorkReportsProps> = ({ workJumps, invoiceSettings, onWorkJumpsClick }) => {
  const [chartMode, setChartMode] = useState<"count" | "value">("count")

  // Generate last 12 months data
  const chartData = useMemo(() => {
    const months = []
    const now = new Date()

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const monthName = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })

      const monthJumps = workJumps.filter((jump) => {
        const jumpDate = new Date(jump.date)
        const jumpMonthKey = `${jumpDate.getFullYear()}-${String(jumpDate.getMonth() + 1).padStart(2, "0")}`
        return jumpMonthKey === monthKey
      })

      const count = monthJumps.length
      const value = monthJumps.reduce((sum, jump) => {
        const jumpValue = (jump.invoiceItems || []).reduce((itemSum, item) => {
          // Use stored rate if available, otherwise use current rate
          const storedRate = jump.rateAtTimeOfJump?.find((r) => r.service === item)?.rate
          return itemSum + (storedRate || invoiceSettings.rates[item] || 0)
        }, 0)
        return sum + jumpValue
      }, 0)

      months.push({
        month: monthName,
        count,
        value,
      })
    }

    return months
  }, [workJumps, invoiceSettings.rates])

  const totalWorkJumps = workJumps.length
  const totalValue = workJumps.reduce((sum, jump) => {
    const jumpValue = (jump.invoiceItems || []).reduce((itemSum, item) => {
      // Use stored rate if available, otherwise use current rate
      const storedRate = jump.rateAtTimeOfJump?.find((r) => r.service === item)?.rate
      return itemSum + (storedRate || invoiceSettings.rates[item] || 0)
    }, 0)
    return sum + jumpValue
  }, 0)

  const formatCurrency = (amount: number) => {
    return `${invoiceSettings.currency}${amount}`
  }

  const handleTotalWorkJumpsClick = () => {
    onWorkJumpsClick(workJumps)
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleTotalWorkJumpsClick}>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{totalWorkJumps}</p>
              <p className="text-sm text-gray-600">Total Work Jumps</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
              <p className="text-sm text-gray-600">Total Value</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Last 12 Months</CardTitle>
            <div className="flex space-x-2">
              <Button
                variant={chartMode === "count" ? "default" : "outline"}
                size="sm"
                onClick={() => setChartMode("count")}
              >
                Count
              </Button>
              <Button
                variant={chartMode === "value" ? "default" : "outline"}
                size="sm"
                onClick={() => setChartMode("value")}
              >
                Value
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              count: {
                label: "Jump Count",
                color: "hsl(var(--chart-1))",
              },
              value: {
                label: "Value",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value, name) => [
                    chartMode === "value" ? formatCurrency(Number(value)) : value,
                    chartMode === "count" ? "Jumps" : "Value",
                  ]}
                />
                <Bar
                  dataKey={chartMode}
                  fill={chartMode === "count" ? "var(--color-count)" : "var(--color-value)"}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
