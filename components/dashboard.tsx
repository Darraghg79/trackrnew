"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { JumpRecord } from "@/types/jumpRecord"

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

interface DashboardProps {
    jumps: JumpRecord[]
    appSettings: AppSettings
    onNavigateToReports: () => void
    onViewJumpList?: (jumps: JumpRecord[], title: string) => void
}

export const Dashboard: React.FC<DashboardProps> = ({ 
    jumps, 
    appSettings, 
    onNavigateToReports,
    onViewJumpList 
}) => {
    const [jumpFilter, setJumpFilter] = useState<"all" | "work" | "sport">("all")
    const [dateFilter, setDateFilter] = useState<"all" | "month" | "year" | "custom">("all")

    const filteredJumps = useMemo(() => {
        let filtered = [...jumps]

        if (jumpFilter === "work") {
            filtered = filtered.filter(j => j.workJump)
        } else if (jumpFilter === "sport") {
            filtered = filtered.filter(j => !j.workJump)
        }

        const now = new Date()
        if (dateFilter === "month") {
            filtered = filtered.filter(j => {
                const jumpDate = j.date instanceof Date ? j.date : new Date(j.date)
                return jumpDate.getMonth() === now.getMonth() &&
                    jumpDate.getFullYear() === now.getFullYear()
            })
        } else if (dateFilter === "year") {
            filtered = filtered.filter(j => {
                const jumpDate = j.date instanceof Date ? j.date : new Date(j.date)
                return jumpDate.getFullYear() === now.getFullYear()
            })
        }

        return filtered
    }, [jumps, jumpFilter, dateFilter])

    const stats = useMemo(() => {
        const total = filteredJumps.length
        const cutaways = filteredJumps.filter(j => j.cutaway).length
        const dropZones = new Set(filteredJumps.map(j => j.dropZone)).size
        const aircraft = new Set(filteredJumps.map(j => j.aircraft)).size

        const jumpFreefallTime = filteredJumps.reduce((sum, j) => sum + (j.freefallTime || 0), 0)
        const totalFreefallSeconds = jumpFreefallTime + (appSettings.currentFreefallTime || 0)
        const hours = Math.floor(totalFreefallSeconds / 3600)
        const minutes = Math.floor((totalFreefallSeconds % 3600) / 60)
        const seconds = totalFreefallSeconds % 60

        const freefallDistance = filteredJumps.reduce((sum, j) => {
            const exitAlt = j.exitAltitude || 13000
            const deployAlt = j.deploymentAltitude || 3500
            return sum + (exitAlt - deployAlt)
        }, 0)

        const altitudes = filteredJumps
            .map(j => j.exitAltitude || 0)
            .filter(alt => alt > 0)

        const maxAltitude = altitudes.length > 0 ? Math.max(...altitudes) : 0
        const minAltitude = altitudes.length > 0 ? Math.min(...altitudes) : 0

        return {
            total,
            cutaways,
            dropZones,
            aircraft,
            freefallTime: { hours, minutes, seconds },
            freefallDistance,
            maxAltitude,
            minAltitude
        }
    }, [filteredJumps, appSettings.currentFreefallTime])

    const formatFreefallTime = (time: { hours: number; minutes: number; seconds: number }) => {
        if (time.hours > 0) {
            return `${time.hours}h ${time.minutes}m ${time.seconds}s`
        }
        return `${time.minutes}m ${time.seconds}s`
    }

    const formatDistance = (distance: number) => {
        if (appSettings.units === "meters") {
            const meters = Math.round(distance * 0.3048)
            return `${meters.toLocaleString()} m`
        }
        return `${distance.toLocaleString()} ft`
    }

    const getFilterLabel = () => {
        let label = jumpFilter === 'all' ? 'All' : jumpFilter === 'work' ? 'Work' : 'Sport'
        if (dateFilter === 'month') label += ' (This Month)'
        else if (dateFilter === 'year') label += ' (This Year)'
        return label
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="p-4 space-y-4">
                    <div>
                        <p className="text-sm text-gray-600 mb-2">Jump Type</p>
                        <div className="grid grid-cols-3 gap-2">
                            <Button
                                variant={jumpFilter === "all" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setJumpFilter("all")}
                            >
                                All
                            </Button>
                            <Button
                                variant={jumpFilter === "work" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setJumpFilter("work")}
                            >
                                Work
                            </Button>
                            <Button
                                variant={jumpFilter === "sport" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setJumpFilter("sport")}
                            >
                                Sport
                            </Button>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm text-gray-600 mb-2">Date Range</p>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant={dateFilter === "all" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setDateFilter("all")}
                            >
                                All Time
                            </Button>
                            <Button
                                variant={dateFilter === "month" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setDateFilter("month")}
                            >
                                This Month
                            </Button>
                            <Button
                                variant={dateFilter === "year" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setDateFilter("year")}
                            >
                                This Year
                            </Button>
                            <Button
                                variant={dateFilter === "custom" ? "default" : "outline"}
                                size="sm"
                                onClick={() => alert("Custom date range not yet implemented")}
                                disabled
                            >
                                Custom
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
                <Card 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onViewJumpList?.(filteredJumps, `${getFilterLabel()} Jumps`)}
                >
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                        <p className="text-sm text-gray-600">Jumps</p>
                    </CardContent>
                </Card>

                <Card 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                        const cutawayJumps = filteredJumps.filter(j => j.cutaway)
                        onViewJumpList?.(cutawayJumps, `${getFilterLabel()} Cutaways`)
                    }}
                >
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-red-600">{stats.cutaways}</p>
                        <p className="text-sm text-gray-600">Cutaways</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-green-600">{stats.dropZones}</p>
                        <p className="text-sm text-gray-600">Dropzones</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-purple-600">{stats.aircraft}</p>
                        <p className="text-sm text-gray-600">Aircraft</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-xl font-bold text-orange-600">
                            {formatFreefallTime(stats.freefallTime)}
                        </p>
                        <p className="text-sm text-gray-600">Freefall Time</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-xl font-bold text-teal-600">
                            {formatDistance(stats.freefallDistance)}
                        </p>
                        <p className="text-sm text-gray-600">Freefall Distance</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-xl font-bold text-indigo-600">
                            {formatDistance(stats.maxAltitude)}
                        </p>
                        <p className="text-sm text-gray-600">Max Altitude</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-xl font-bold text-pink-600">
                            {formatDistance(stats.minAltitude)}
                        </p>
                        <p className="text-sm text-gray-600">Min Altitude</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}