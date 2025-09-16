"use client"

import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import type { JumpRecord } from "@/types/jumpRecord"

interface JumpListViewProps {
  jumps: JumpRecord[]
  title: string
  onBack: () => void
}

export const JumpListView: React.FC<JumpListViewProps> = ({ jumps, title, onBack }) => {
  // Sort jumps by jump number (highest to lowest)
  const sortedJumps = [...jumps].sort((a, b) => b.jumpNumber - a.jumpNumber)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <Button onClick={onBack} variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>

      <p className="text-sm text-gray-600">
        Showing {sortedJumps.length} jump{sortedJumps.length !== 1 ? 's' : ''}
      </p>

      <div className="space-y-2">
        {sortedJumps.map((jump) => (
          <Card key={`jump-${jump.jumpNumber}`}>
            <CardContent className="p-3">
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium">Jump #{jump.jumpNumber}</span>
                <span className="text-sm text-gray-600">
                  {(jump.date instanceof Date ? jump.date : new Date(jump.date)).toLocaleDateString()}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <p>{jump.dropZone} • {jump.jumpType}</p>
                {jump.customerName && (
                  <p className="text-blue-600">Customer: {jump.customerName}</p>
                )}
                {jump.invoiceItems && jump.invoiceItems.length > 0 && (
                  <p className="text-gray-500">
                    Services: {jump.invoiceItems.join(', ')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}