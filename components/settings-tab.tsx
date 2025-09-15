"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import type { InvoiceSettings, DropZoneBillingDetails } from "@/types/invoice"
import type { AppSettings, JumpCountAudit, FreefallTimeAudit } from "@/types/settings"
import type { JumpRecord } from "@/types/jump-record"
import { DropZoneManager } from "@/components/dropzone-manager"
import { GearManager } from "@/components/gear-manager"
import type { DropZone } from "@/types/dropzone"
import type { GearItem } from "@/types/gear"
import type { GearGroup } from "@/types/gear"
import type { GearOption } from "@/types/gear"
import { formatDate } from "@/utils/date-formatting"

interface SettingsTabProps {
  invoiceSettings: InvoiceSettings
  onUpdateSettings: (settings: InvoiceSettings) => void
  appSettings: AppSettings
  onUpdateAppSettings: (settings: AppSettings) => void
  dropZoneOptions: string[]
  onUpdateDropZoneOptions: (options: string[]) => void
  dropZones: DropZone[]
  onUpdateDropZones: (dropZones: DropZone[]) => void
  aircraftOptions: string[]
  onUpdateAircraftOptions: (options: string[]) => void
  jumpTypeOptions: string[]
  onUpdateJumpTypeOptions: (options: string[]) => void
  gearItems: GearItem[]
  onUpdateGearItems: (items: GearItem[]) => void
  gearGroups: GearGroup[]
  onUpdateGearGroups: (groups: GearGroup[]) => void
  gearOptions: GearOption[]
  onUpdateGearOptions: (options: GearOption[]) => void
  savedJumps: JumpRecord[]
  onUpdateJumpsAircraft: (oldAircraft: string, newAircraft: string) => void
  onUpdateJumpsDropZone: (oldDropZone: string, newDropZone: string) => void
  onUpdateJumpsJumpType: (oldJumpType: string, newJumpType: string) => void
  onUnitsChange: (newUnits: "feet" | "meters") => void
}

type SettingsSection = 
  | "main"
  | "profile"
  | "invoice"
  | "logbook"
  | "gear"
  | "experience"
  | "data"

export const SettingsTab: React.FC<SettingsTabProps> = ({
  invoiceSettings,
  onUpdateSettings,
  appSettings,
  onUpdateAppSettings,
  dropZoneOptions,
  onUpdateDropZoneOptions,
  dropZones,
  onUpdateDropZones,
  aircraftOptions,
  onUpdateAircraftOptions,
  jumpTypeOptions,
  onUpdateJumpTypeOptions,
  gearItems,
  onUpdateGearItems,
  gearGroups,
  onUpdateGearGroups,
  gearOptions,
  onUpdateGearOptions,
  savedJumps,
  onUpdateJumpsAircraft,
  onUpdateJumpsDropZone,
  onUpdateJumpsJumpType,
  onUnitsChange,
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>("main")
  const [tempInvoiceSettings, setTempInvoiceSettings] = useState(invoiceSettings)
  const [tempAppSettings, setTempAppSettings] = useState(appSettings)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [selectedDropZone, setSelectedDropZone] = useState<string>("")
  const [dropZoneDetails, setDropZoneDetails] = useState<DropZoneBillingDetails>({
    address: "",
    financeContact: "",
    financeEmail: "",
  })
  const [newJumpCount, setNewJumpCount] = useState(appSettings.currentJumpNumber.toString())
  const [jumpCountReason, setJumpCountReason] = useState("")
  const [jumpCountNote, setJumpCountNote] = useState("")
  const [showJumpCountAudit, setShowJumpCountAudit] = useState(false)
  const [showBillingDetails, setShowBillingDetails] = useState(false)

  // Freefall time management states
  const [newFreefallTime, setNewFreefallTime] = useState("")
  const [freefallTimeReason, setFreefallTimeReason] = useState("")
  const [freefallTimeNote, setFreefallTimeNote] = useState("")
  const [showFreefallTimeAudit, setShowFreefallTimeAudit] = useState(false)

  // Calculate gear service reminders for red flag indicator
  const gearServiceReminders = useMemo(() => {
    const today = new Date()
    const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    return gearItems.filter(
      (item) =>
        item.isActive &&
        item.requiresService &&
        item.nextServiceDate &&
        (new Date(item.nextServiceDate) < today || new Date(item.nextServiceDate) <= oneWeekFromNow),
    )
  }, [gearItems])

  // Complete aircraft list from the CSV file
  const defaultAircraftList = [
    "Yakovlev Yak-12",
    "Cessna 172",
    "Cessna 180",
    "Cessna 182",
    "Cessna 185",
    "Cessna 206",
    "Cessna 207",
    "Cessna 208 Caravan",
    "Cessna 210",
    "Piper Cherokee",
    "Piper Navajo",
    "Piper Aztec",
    "Beechcraft Bonanza",
    "Beechcraft King Air",
    "DHC-6 Twin Otter",
    "Britten-Norman Islander",
    "Pilatus Porter PC-6",
    "Antonov An-2",
    "Antonov An-28",
    "Let L-410",
    "Dornier Do 228",
    "CASA C-212",
    "Short Skyvan",
    "Fokker F27",
    "Douglas DC-3",
    "Douglas DC-6",
    "Lockheed C-130 Hercules",
    "Boeing 727",
    "Boeing 737",
    "Airbus A300",
    "Helicopter - Bell 206",
    "Helicopter - Bell 212",
    "Helicopter - Bell 412",
    "Helicopter - Eurocopter AS350",
    "Helicopter - Mil Mi-8",
    "Helicopter - Sikorsky S-76",
    "Hot Air Balloon",
    "Glider - Various",
    "Ultralight - Various",
    "Experimental Aircraft",
  ]

  // Default jump types list
  const defaultJumpTypesList = [
    "AFF",
    "Angle/Tracking",
    "Coach",
    "Freefly",
    "FS Belly",
    "FS Vertical",
    "Hop & Pop",
    "Tandem",
    "Tandem Camera",
    "Wingsuit",
  ]

  // Helper function to format freefall time
  const formatFreefallTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    } else {
      return `${remainingSeconds}s`
    }
  }

  // Helper function to parse freefall time input (supports various formats)
  const parseFreefallTimeInput = (input: string): number => {
    const cleanInput = input.toLowerCase().trim()

    // Handle formats like "1h 30m 45s", "90m 30s", "150s", "2:30:45", etc.
    let totalSeconds = 0

    // Try to match hours, minutes, seconds format (e.g., "1h 30m 45s")
    const hmsMatch = cleanInput.match(/(?:(\d+)h\s*)?(?:(\d+)m\s*)?(?:(\d+)s?)?/)
    if (hmsMatch) {
      const hours = Number.parseInt(hmsMatch[1] || "0")
      const minutes = Number.parseInt(hmsMatch[2] || "0")
      const seconds = Number.parseInt(hmsMatch[3] || "0")
      totalSeconds = hours * 3600 + minutes * 60 + seconds
    }

    // Try to match time format (e.g., "2:30:45" or "30:45")
    const timeMatch = cleanInput.match(/^(\d+):(\d+)(?::(\d+))?$/)
    if (timeMatch && totalSeconds === 0) {
      const part1 = Number.parseInt(timeMatch[1])
      const part2 = Number.parseInt(timeMatch[2])
      const part3 = Number.parseInt(timeMatch[3] || "0")

      if (timeMatch[3]) {
        // Format: hours:minutes:seconds
        totalSeconds = part1 * 3600 + part2 * 60 + part3
      } else {
        // Format: minutes:seconds
        totalSeconds = part1 * 60 + part2
      }
    }

    // If no pattern matched, try to parse as plain seconds
    if (totalSeconds === 0) {
      const plainSeconds = Number.parseInt(cleanInput.replace(/\D/g, ""))
      if (!isNaN(plainSeconds)) {
        totalSeconds = plainSeconds
      }
    }

    return totalSeconds
  }

  const handleInvoiceSettingsChange = (field: string, value: any) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".")
      setTempInvoiceSettings((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof InvoiceSettings],
          [child]: value,
        },
      }))
    } else {
      setTempInvoiceSettings((prev) => ({ ...prev, [field]: value }))
    }
    setHasUnsavedChanges(true)
  }

  const handleAppSettingsChange = (field: string, value: any) => {
    setTempAppSettings((prev) => ({ ...prev, [field]: value }))
    setHasUnsavedChanges(true)
  }

  const handleRateChange = (service: string, rate: string) => {
    const numericRate = Number.parseFloat(rate) || 0
    setTempInvoiceSettings((prev) => ({
      ...prev,
      rates: { ...prev.rates, [service]: numericRate },
    }))
    setHasUnsavedChanges(true)
  }

  const handleJumpCountUpdate = () => {
    const newCount = Number.parseInt(newJumpCount) || 0
    if (newCount === tempAppSettings.currentJumpNumber) return

    if (!jumpCountReason.trim()) {
      alert("Please provide a reason for changing the jump count")
      return
    }

    const auditEntry: JumpCountAudit = {
      id: `audit_${Date.now()}`,
      timestamp: new Date(),
      previousCount: tempAppSettings.currentJumpNumber,
      newCount: newCount,
      reason: jumpCountReason,
      userNote: jumpCountNote.trim() || undefined,
    }

    setTempAppSettings((prev) => ({
      ...prev,
      currentJumpNumber: newCount,
      jumpCountAuditLog: [...prev.jumpCountAuditLog, auditEntry],
    }))

    setJumpCountReason("")
    setJumpCountNote("")
    setHasUnsavedChanges(true)
  }

  const handleFreefallTimeUpdate = () => {
    const parsedTime = parseFreefallTimeInput(newFreefallTime)

    if (parsedTime === tempAppSettings.currentFreefallTime) return

    if (!freefallTimeReason.trim()) {
      alert("Please provide a reason for changing the freefall time")
      return
    }

    const auditEntry: FreefallTimeAudit = {
      id: `freefall_audit_${Date.now()}`,
      timestamp: new Date(),
      previousTime: tempAppSettings.currentFreefallTime,
      newTime: parsedTime,
      reason: freefallTimeReason,
      userNote: freefallTimeNote.trim() || undefined,
    }

    setTempAppSettings((prev) => ({
      ...prev,
      currentFreefallTime: parsedTime,
      freefallTimeAuditLog: [...prev.freefallTimeAuditLog, auditEntry],
    }))

    setNewFreefallTime("")
    setFreefallTimeReason("")
    setFreefallTimeNote("")
    setHasUnsavedChanges(true)
  }

  const handleUnitsChange = (newUnits: "feet" | "meters") => {
    if (newUnits === tempAppSettings.units) return

    const jumpCount = savedJumps.length
    if (jumpCount > 0) {
      const confirmMessage = `This will convert altitude values in ${jumpCount} existing jump record${
        jumpCount > 1 ? "s" : ""
      } from ${tempAppSettings.units} to ${newUnits}. This action cannot be undone. Continue?`

      if (!confirm(confirmMessage)) {
        return
      }
    }

    // Update temp settings
    setTempAppSettings((prev) => ({ ...prev, units: newUnits }))
    setHasUnsavedChanges(true)

    // Call the conversion handler
    onUnitsChange(newUnits)
  }

  const handleSaveSettings = () => {
    onUpdateSettings(tempInvoiceSettings)
    onUpdateAppSettings(tempAppSettings)
    setHasUnsavedChanges(false)
  }

  const handleResetSettings = () => {
    setTempInvoiceSettings(invoiceSettings)
    setTempAppSettings(appSettings)
    setNewJumpCount(appSettings.currentJumpNumber.toString())
    setNewFreefallTime("")
    setHasUnsavedChanges(false)
  }

  const handleDropZoneSelect = (dzName: string) => {
    setSelectedDropZone(dzName)
    const existing = tempInvoiceSettings.dropZoneBilling[dzName]
    if (existing) {
      setDropZoneDetails(existing)
    } else {
      setDropZoneDetails({
        address: "",
        financeContact: "",
        financeEmail: "",
      })
    }
    setShowBillingDetails(true)
  }

  const handleSaveDropZone = () => {
    if (selectedDropZone) {
      setTempInvoiceSettings((prev) => ({
        ...prev,
        dropZoneBilling: {
          ...prev.dropZoneBilling,
          [selectedDropZone]: dropZoneDetails,
        },
      }))
      setHasUnsavedChanges(true)
    }
  }

  const handleAddAircraft = () => {
    const newAircraft = prompt("Enter new aircraft name:")
    if (newAircraft && newAircraft.trim() && !aircraftOptions.includes(newAircraft.trim())) {
      onUpdateAircraftOptions([...aircraftOptions, newAircraft.trim()])
    } else if (newAircraft && aircraftOptions.includes(newAircraft.trim())) {
      alert("This aircraft already exists in the list.")
    }
  }

  const handleRemoveAircraft = (aircraft: string) => {
    // Check if this aircraft is used in any existing jumps
    const jumpsUsingAircraft = savedJumps.filter((jump) => jump.aircraft === aircraft)

    if (jumpsUsingAircraft.length > 0) {
      const confirmDelete = confirm(
        `"${aircraft}" is used in ${jumpsUsingAircraft.length} jump record(s). ` +
          `If you delete it, you'll need to select a replacement aircraft for those jumps. Continue?`,
      )

      if (!confirmDelete) return

      // Show replacement aircraft selection
      const remainingAircraft = aircraftOptions.filter((a) => a !== aircraft)
      if (remainingAircraft.length === 0) {
        alert("Cannot delete the last aircraft. Add another aircraft first.")
        return
      }

      const replacementOptions = remainingAircraft.map((a, i) => `${i + 1}. ${a}`).join("\n")
      const selection = prompt(
        `Select replacement aircraft for ${jumpsUsingAircraft.length} jump(s):\n\n${replacementOptions}\n\nEnter the number:`,
      )

      const selectedIndex = Number.parseInt(selection || "") - 1
      if (selectedIndex >= 0 && selectedIndex < remainingAircraft.length) {
        const replacementAircraft = remainingAircraft[selectedIndex]

        // Update all jumps using this aircraft
        onUpdateJumpsAircraft(aircraft, replacementAircraft)

        // Remove the aircraft from options
        onUpdateAircraftOptions(aircraftOptions.filter((a) => a !== aircraft))

        alert(`Updated ${jumpsUsingAircraft.length} jump(s) to use "${replacementAircraft}" instead of "${aircraft}".`)
      } else {
        alert("Invalid selection. Aircraft not deleted.")
      }
    } else {
      // No jumps using this aircraft, safe to delete
      if (confirm(`Remove "${aircraft}" from aircraft list?`)) {
        onUpdateAircraftOptions(aircraftOptions.filter((a) => a !== aircraft))
      }
    }
  }

  const handleEditAircraft = (oldAircraft: string) => {
    const newName = prompt(`Edit aircraft name:`, oldAircraft)

    if (!newName || newName.trim() === oldAircraft) return

    const trimmedName = newName.trim()

    if (aircraftOptions.includes(trimmedName)) {
      alert("An aircraft with this name already exists.")
      return
    }

    // Check if this aircraft is used in any existing jumps
    const jumpsUsingAircraft = savedJumps.filter((jump) => jump.aircraft === oldAircraft)

    if (jumpsUsingAircraft.length > 0) {
      const confirmEdit = confirm(
        `"${oldAircraft}" is used in ${jumpsUsingAircraft.length} jump record(s). ` +
          `All records will be updated to use "${trimmedName}". Continue?`,
      )

      if (!confirmEdit) return

      // Update all jumps using this aircraft
      onUpdateJumpsAircraft(oldAircraft, trimmedName)

      alert(`Updated ${jumpsUsingAircraft.length} jump record(s) to use "${trimmedName}".`)
    }

    // Update the aircraft in the options list
    const updatedOptions = aircraftOptions.map((aircraft) => (aircraft === oldAircraft ? trimmedName : aircraft))
    onUpdateAircraftOptions(updatedOptions)
  }

  const handleAddJumpType = () => {
    const newJumpType = prompt("Enter new jump type name:")
    if (newJumpType && newJumpType.trim() && !jumpTypeOptions.includes(newJumpType.trim())) {
      onUpdateJumpTypeOptions([...jumpTypeOptions, newJumpType.trim()])
    } else if (newJumpType && jumpTypeOptions.includes(newJumpType.trim())) {
      alert("This jump type already exists in the list.")
    }
  }

  const handleRemoveJumpType = (jumpType: string) => {
    // Check if this jump type is used in any existing jumps
    const jumpsUsingJumpType = savedJumps.filter((jump) => jump.jumpType === jumpType)

    if (jumpsUsingJumpType.length > 0) {
      const confirmDelete = confirm(
        `"${jumpType}" is used in ${jumpsUsingJumpType.length} jump record(s). ` +
          `If you delete it, you'll need to select a replacement jump type for those jumps. Continue?`,
      )

      if (!confirmDelete) return

      // Show replacement jump type selection
      const remainingJumpTypes = jumpTypeOptions.filter((jt) => jt !== jumpType)
      if (remainingJumpTypes.length === 0) {
        alert("Cannot delete the last jump type. Add another jump type first.")
        return
      }

      const replacementOptions = remainingJumpTypes.map((jt, i) => `${i + 1}. ${jt}`).join("\n")
      const selection = prompt(
        `Select replacement jump type for ${jumpsUsingJumpType.length} jump(s):\n\n${replacementOptions}\n\nEnter the number:`,
      )

      const selectedIndex = Number.parseInt(selection || "") - 1
      if (selectedIndex >= 0 && selectedIndex < remainingJumpTypes.length) {
        const replacementJumpType = remainingJumpTypes[selectedIndex]

        // Update all jumps using this jump type
        onUpdateJumpsJumpType(jumpType, replacementJumpType)

        // Remove the jump type from options
        onUpdateJumpTypeOptions(jumpTypeOptions.filter((jt) => jt !== jumpType))

        alert(`Updated ${jumpsUsingJumpType.length} jump(s) to use "${replacementJumpType}" instead of "${jumpType}".`)
      } else {
        alert("Invalid selection. Jump type not deleted.")
      }
    } else {
      // No jumps using this jump type, safe to delete
      if (confirm(`Remove "${jumpType}" from jump type list?`)) {
        onUpdateJumpTypeOptions(jumpTypeOptions.filter((jt) => jt !== jumpType))
      }
    }
  }

  const handleEditJumpType = (oldJumpType: string) => {
    const newName = prompt(`Edit jump type name:`, oldJumpType)

    if (!newName || newName.trim() === oldJumpType) return

    const trimmedName = newName.trim()

    if (jumpTypeOptions.includes(trimmedName)) {
      alert("A jump type with this name already exists.")
      return
    }

    // Check if this jump type is used in any existing jumps
    const jumpsUsingJumpType = savedJumps.filter((jump) => jump.jumpType === oldJumpType)

    if (jumpsUsingJumpType.length > 0) {
      const confirmEdit = confirm(
        `"${oldJumpType}" is used in ${jumpsUsingJumpType.length} jump record(s). ` +
          `All records will be updated to use "${trimmedName}". Continue?`,
      )

      if (!confirmEdit) return

      // Update all jumps using this jump type
      onUpdateJumpsJumpType(oldJumpType, trimmedName)

      alert(`Updated ${jumpsUsingJumpType.length} jump record(s) to use "${trimmedName}".`)
    }

    // Update the jump type in the options list
    const updatedOptions = jumpTypeOptions.map((jumpType) => (jumpType === oldJumpType ? trimmedName : jumpType))
    onUpdateJumpTypeOptions(updatedOptions)
  }

  // Simple icon components (you can replace with actual icons later)
  const UserIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )

  const DollarIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )

  const LocationIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )

  const SettingsIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )

  const BoxIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  )

  const DatabaseIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
  )

  const ClockIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )

  const renderMainMenu = () => (
    <div className="space-y-4">
      {/* Profile Settings */}
      <button
        onClick={() => setActiveSection("profile")}
        className="w-full p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <UserIcon />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Profile Settings</h3>
              <p className="text-sm text-gray-500">Name, address, units, and date format</p>
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>

      {/* Invoice Settings */}
      <button
        onClick={() => setActiveSection("invoice")}
        className="w-full p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <DollarIcon />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Invoice Settings</h3>
              <p className="text-sm text-gray-500">Tax, banking, currency, and billing details</p>
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>

      {/* Logbook Settings */}
      <button
        onClick={() => setActiveSection("logbook")}
        className="w-full p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <LocationIcon />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Logbook Settings</h3>
              <p className="text-sm text-gray-500">Drop zones, aircraft, and jump types</p>
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>

      {/* Gear Management */}
      <button
        onClick={() => setActiveSection("gear")}
        className="w-full p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all text-left relative"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <BoxIcon />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Gear Management</h3>
              <p className="text-sm text-gray-500">Manage parachutes and equipment</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {gearServiceReminders.length > 0 && (
              <span className="flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                <span className="text-xs text-red-600 font-medium">{gearServiceReminders.length}</span>
              </span>
            )}
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </button>

      {/* Previous Experience */}
      <button
        onClick={() => setActiveSection("experience")}
        className="w-full p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <ClockIcon />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Previous Experience</h3>
              <p className="text-sm text-gray-500">Update jump number and freefall time</p>
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>

      {/* Data Management */}
      <button
        onClick={() => setActiveSection("data")}
        className="w-full p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <DatabaseIcon />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Data Management</h3>
              <p className="text-sm text-gray-500">Import, export, and statistics</p>
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>
    </div>
  )

  const renderProfileSection = () => (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            onClick={() => setActiveSection("main")}
            className="p-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <h2 className="text-xl font-semibold text-gray-900">Profile Settings</h2>
        </div>
        {hasUnsavedChanges && (
          <Button onClick={handleSaveSettings} className="bg-blue-600 hover:bg-blue-700">
            Save
          </Button>
        )}
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="instructorName">Full Name</Label>
            <Input
              id="instructorName"
              value={tempInvoiceSettings.instructorInfo.name}
              onChange={(e) => handleInvoiceSettingsChange("instructorInfo.name", e.target.value)}
              placeholder="Your full name"
            />
          </div>

          <div>
            <Label htmlFor="instructorAddress">Address</Label>
            <Textarea
              id="instructorAddress"
              value={tempInvoiceSettings.instructorInfo.address}
              onChange={(e) => handleInvoiceSettingsChange("instructorInfo.address", e.target.value)}
              placeholder="Your address for invoices"
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Units Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Units</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-base font-medium mb-3 block">Altitude Units</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="units-feet"
                  name="units"
                  value="feet"
                  checked={tempAppSettings.units === "feet"}
                  onChange={() => handleUnitsChange("feet")}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="units-feet" className="text-sm font-medium text-gray-700">
                  Feet (ft) - Imperial
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="units-meters"
                  name="units"
                  value="meters"
                  checked={tempAppSettings.units === "meters"}
                  onChange={() => handleUnitsChange("meters")}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="units-meters" className="text-sm font-medium text-gray-700">
                  Meters (m) - Metric
                </label>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Changing units will convert all existing altitude values in your jump records.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Date Format Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Date Format</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-base font-medium mb-3 block">Date Display Format</Label>
            <div className="space-y-3">
              {[
                { value: "DD/MM/YYYY", label: "DD/MM/YYYY", example: formatDate(new Date(), "DD/MM/YYYY") },
                { value: "MM/DD/YYYY", label: "MM/DD/YYYY", example: formatDate(new Date(), "MM/DD/YYYY") },
                { value: "YYYY-MM-DD", label: "YYYY-MM-DD", example: formatDate(new Date(), "YYYY-MM-DD") },
              ].map((format) => (
                <div key={format.value} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id={`date-${format.value}`}
                      name="dateFormat"
                      value={format.value}
                      checked={tempAppSettings.dateFormat === format.value}
                      onChange={() => handleAppSettingsChange("dateFormat", format.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <label htmlFor={`date-${format.value}`} className="text-sm font-medium text-gray-700">
                      {format.label}
                    </label>
                  </div>
                  <span className="text-sm text-gray-500">{format.example}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              This affects how dates are displayed throughout the app.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderInvoiceSection = () => (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            onClick={() => setActiveSection("main")}
            className="p-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <h2 className="text-xl font-semibold text-gray-900">Invoice Settings</h2>
        </div>
        {hasUnsavedChanges && (
          <Button onClick={handleSaveSettings} className="bg-blue-600 hover:bg-blue-700">
            Save
          </Button>
        )}
      </div>

      {/* Tax & Banking Information */}
      <Card>
        <CardHeader>
          <CardTitle>Tax & Banking Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="taxNumber">Tax Number (Optional)</Label>
            <Input
              id="taxNumber"
              value={tempInvoiceSettings.instructorInfo.taxNumber || ""}
              onChange={(e) => handleInvoiceSettingsChange("instructorInfo.taxNumber", e.target.value)}
              placeholder="VAT/Tax registration number"
            />
          </div>

          <div>
            <Label htmlFor="bankDetails">Bank Details</Label>
            <Textarea
              id="bankDetails"
              value={tempInvoiceSettings.instructorInfo.bankDetails}
              onChange={(e) => handleInvoiceSettingsChange("instructorInfo.bankDetails", e.target.value)}
              placeholder="IBAN, account details for payments"
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Currency & Tax */}
      <Card>
        <CardHeader>
          <CardTitle>Currency & Tax</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currency">Currency Symbol</Label>
              <Input
                id="currency"
                value={tempInvoiceSettings.currency}
                onChange={(e) => handleInvoiceSettingsChange("currency", e.target.value)}
                placeholder="€"
              />
            </div>
            <div>
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                value={tempInvoiceSettings.taxRate * 100}
                onChange={(e) => handleInvoiceSettingsChange("taxRate", Number.parseFloat(e.target.value) / 100 || 0)}
                placeholder="0"
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Rates */}
      <Card>
        <CardHeader>
          <CardTitle>Service Rates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(tempInvoiceSettings.rates).map(([service, rate]) => (
            <div key={service} className="flex items-center justify-between">
              <Label className="flex-1">{service}</Label>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">{tempInvoiceSettings.currency}</span>
                <Input
                  type="number"
                  value={rate}
                  onChange={(e) => handleRateChange(service, e.target.value)}
                  className="w-20"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          ))}

          <div className="pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => {
                const newService = prompt("Enter new service name:")
                if (newService && !tempInvoiceSettings.rates[newService]) {
                  handleRateChange(newService, "0")
                }
              }}
              className="w-full"
            >
              + Add New Service
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Drop Zone Billing */}
      <Card>
        <CardHeader>
          <CardTitle>Drop Zone Billing Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">Configure billing details for drop zones where you've done work jumps</p>

          {/* Get unique dropzones from work jumps */}
          {(() => {
            const workJumpDropZones = [
              ...new Set(savedJumps.filter((jump) => jump.workJump).map((jump) => jump.dropZone)),
            ].sort()

            if (workJumpDropZones.length === 0) {
              return (
                <div className="text-center py-6 text-gray-500">
                  <p>No work jumps recorded yet</p>
                  <p className="text-sm">Drop zones will appear here after you log work jumps</p>
                </div>
              )
            }

            return (
              <div className="space-y-2">
                {workJumpDropZones.map((dzName) => (
                  <button
                    key={dzName}
                    onClick={() => handleDropZoneSelect(dzName)}
                    className="w-full p-3 text-left border rounded-md transition-colors hover:border-blue-500 hover:bg-blue-50"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{dzName}</div>
                        {tempInvoiceSettings.dropZoneBilling[dzName] ? (
                          <div className="text-sm text-green-600">✓ Billing details configured</div>
                        ) : (
                          <div className="text-sm text-orange-600">⚠ Billing details needed</div>
                        )}
                      </div>
                      <div className="text-blue-600">→</div>
                    </div>
                  </button>
                ))}
              </div>
            )
          })()}
        </CardContent>
      </Card>
    </div>
  )

  const renderLogbookSection = () => (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            onClick={() => setActiveSection("main")}
            className="p-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <h2 className="text-xl font-semibold text-gray-900">Logbook Settings</h2>
        </div>
      </div>

      {/* Drop Zone Manager */}
      <DropZoneManager
        dropZones={dropZones}
        onUpdateDropZones={onUpdateDropZones}
        onUpdateDropZoneOptions={onUpdateDropZoneOptions}
        savedJumps={savedJumps}
        onUpdateJumpsDropZone={onUpdateJumpsDropZone}
      />

      {/* Aircraft Management */}
      <Card>
        <CardHeader>
          <CardTitle>Aircraft Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600">Manage available aircraft for jump logging</p>
            <Button onClick={handleAddAircraft} className="bg-blue-600 hover:bg-blue-700 text-white">
              + Add Aircraft
            </Button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {aircraftOptions.map((aircraft) => (
              <div key={aircraft} className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center space-x-3">
                  <span className="font-medium">{aircraft}</span>
                  {defaultAircraftList.includes(aircraft) && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Default</span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleEditAircraft(aircraft)}
                    variant="ghost"
                    className="text-blue-600 hover:text-blue-800 px-2 py-1 h-auto"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleRemoveAircraft(aircraft)}
                    variant="ghost"
                    className="text-red-600 hover:text-red-800 px-2 py-1 h-auto"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Jump Type Management */}
      <Card>
        <CardHeader>
          <CardTitle>Jump Type Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600">Manage available jump types for jump logging</p>
            <Button onClick={handleAddJumpType} className="bg-blue-600 hover:bg-blue-700 text-white">
              + Add Jump Type
            </Button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {jumpTypeOptions.map((jumpType) => (
              <div key={jumpType} className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center space-x-3">
                  <span className="font-medium">{jumpType}</span>
                  {defaultJumpTypesList.includes(jumpType) && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Default</span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleEditJumpType(jumpType)}
                    variant="ghost"
                    className="text-blue-600 hover:text-blue-800 px-2 py-1 h-auto"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleRemoveJumpType(jumpType)}
                    variant="ghost"
                    className="text-red-600 hover:text-red-800 px-2 py-1 h-auto"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderGearSection = () => (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            onClick={() => setActiveSection("main")}
            className="p-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <h2 className="text-xl font-semibold text-gray-900">Gear Management</h2>
        </div>
      </div>

      <GearManager
        gearItems={gearItems}
        gearGroups={gearGroups}
        onUpdateGearItems={onUpdateGearItems}
        onUpdateGearGroups={onUpdateGearGroups}
        onUpdateGearOptions={onUpdateGearOptions}
      />
    </div>
  )

  const renderExperienceSection = () => (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            onClick={() => setActiveSection("main")}
            className="p-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <h2 className="text-xl font-semibold text-gray-900">Previous Experience</h2>
        </div>
        {hasUnsavedChanges && (
          <Button onClick={handleSaveSettings} className="bg-blue-600 hover:bg-blue-700">
            Save
          </Button>
        )}
      </div>

      {/* Jump Count Management */}
      <Card>
        <CardHeader>
          <CardTitle>Jump Count Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-md">
            <p className="text-sm text-blue-800 font-medium mb-2">
              Current Jump #: {tempAppSettings.currentJumpNumber}
            </p>
            <p className="text-xs text-blue-600">
              Next jump will be logged as #{tempAppSettings.currentJumpNumber + 1}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="newJumpCount">Update Current Jump #</Label>
              <Input
                id="newJumpCount"
                type="number"
                value={newJumpCount}
                onChange={(e) => setNewJumpCount(e.target.value)}
                placeholder="Enter current jump number"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                This is your current jump count. Next jump will be #{(Number.parseInt(newJumpCount) || 0) + 1}
              </p>
            </div>

            <div>
              <Label htmlFor="jumpCountReason">Reason for Change *</Label>
              <Input
                id="jumpCountReason"
                value={jumpCountReason}
                onChange={(e) => setJumpCountReason(e.target.value)}
                placeholder="e.g., Missed logging jumps, Correction, etc."
              />
            </div>

            <div>
              <Label htmlFor="jumpCountNote">Additional Notes (Optional)</Label>
              <Textarea
                id="jumpCountNote"
                value={jumpCountNote}
                onChange={(e) => setJumpCountNote(e.target.value)}
                placeholder="Any additional details about this change"
                className="min-h-[60px]"
              />
            </div>

            <Button
              onClick={handleJumpCountUpdate}
              disabled={!jumpCountReason.trim() || newJumpCount === tempAppSettings.currentJumpNumber.toString()}
              className="w-full"
            >
              Update Jump Count
            </Button>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <Label className="text-base font-medium">Audit Log</Label>
              <Button
                variant="ghost"
                onClick={() => setShowJumpCountAudit(!showJumpCountAudit)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showJumpCountAudit ? "Hide" : "Show"} History
              </Button>
            </div>

            {showJumpCountAudit && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {tempAppSettings.jumpCountAuditLog.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No changes recorded</p>
                ) : (
                  tempAppSettings.jumpCountAuditLog
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((entry) => (
                      <div key={entry.id} className="p-3 bg-gray-50 rounded-md text-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium">
                            {entry.previousCount} → {entry.newCount}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(entry.timestamp).toLocaleDateString()}{" "}
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-1">
                          <span className="font-medium">Reason:</span> {entry.reason}
                        </p>
                        {entry.userNote && (
                          <p className="text-gray-600 text-xs">
                            <span className="font-medium">Note:</span> {entry.userNote}
                          </p>
                        )}
                      </div>
                    ))
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Freefall Time Management */}
      <Card>
        <CardHeader>
          <CardTitle>Freefall Time Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 p-4 rounded-md">
            <p className="text-sm text-green-800 font-medium mb-2">
              Current Freefall Time: {formatFreefallTime(tempAppSettings.currentFreefallTime)}
            </p>
            <p className="text-xs text-green-600">Each new jump will add its freefall time to this total</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="newFreefallTime">Update Current Freefall Time</Label>
              <Input
                id="newFreefallTime"
                value={newFreefallTime}
                onChange={(e) => setNewFreefallTime(e.target.value)}
                placeholder="e.g., 2h 30m 45s, 150m 30s, 9045s, 2:30:45"
              />
              <p className="text-xs text-gray-500 mt-1">Supports formats: "1h 30m 45s", "90m 30s", "150s", "2:30:45"</p>
              {newFreefallTime && (
                <p className="text-xs text-blue-600 mt-1">
                  Parsed as: {formatFreefallTime(parseFreefallTimeInput(newFreefallTime))}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="freefallTimeReason">Reason for Change *</Label>
              <Input
                id="freefallTimeReason"
                value={freefallTimeReason}
                onChange={(e) => setFreefallTimeReason(e.target.value)}
                placeholder="e.g., Importing from old logbook, Correction, etc."
              />
            </div>

            <div>
              <Label htmlFor="freefallTimeNote">Additional Notes (Optional)</Label>
              <Textarea
                id="freefallTimeNote"
                value={freefallTimeNote}
                onChange={(e) => setFreefallTimeNote(e.target.value)}
                placeholder="Any additional details about this change"
                className="min-h-[60px]"
              />
            </div>

            <Button
              onClick={handleFreefallTimeUpdate}
              disabled={!freefallTimeReason.trim() || !newFreefallTime.trim()}
              className="w-full"
            >
              Update Freefall Time
            </Button>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <Label className="text-base font-medium">Freefall Time History</Label>
              <Button
                variant="ghost"
                onClick={() => setShowFreefallTimeAudit(!showFreefallTimeAudit)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showFreefallTimeAudit ? "Hide" : "Show"} History
              </Button>
            </div>

            {showFreefallTimeAudit && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {tempAppSettings.freefallTimeAuditLog.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No changes recorded</p>
                ) : (
                  tempAppSettings.freefallTimeAuditLog
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((entry) => (
                      <div key={entry.id} className="p-3 bg-gray-50 rounded-md text-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium">
                            {formatFreefallTime(entry.previousTime)} → {formatFreefallTime(entry.newTime)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(entry.timestamp).toLocaleDateString()}{" "}
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-1">
                          <span className="font-medium">Reason:</span> {entry.reason}
                        </p>
                        {entry.userNote && (
                          <p className="text-gray-600 text-xs">
                            <span className="font-medium">Note:</span> {entry.userNote}
                          </p>
                        )}
                      </div>
                    ))
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderDataSection = () => (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            onClick={() => setActiveSection("main")}
            className="p-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <h2 className="text-xl font-semibold text-gray-900">Data Management</h2>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full bg-transparent">
            Export Jump Data (CSV)
          </Button>
          <Button variant="outline" className="w-full bg-transparent">
            Export Invoice Data (CSV)
          </Button>
          <Button variant="outline" className="w-full bg-transparent">
            Backup All Data (JSON)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full bg-transparent">
            Import Jump Data (CSV)
          </Button>
          <Button variant="outline" className="w-full bg-transparent">
            Restore from Backup (JSON)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-6 text-gray-500">
            <p>Statistics features coming soon</p>
            <p className="text-sm mt-2">View detailed analytics about your jumps and earnings</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            onClick={handleResetSettings}
            className="w-full text-red-600 border-red-300 hover:bg-red-50 bg-transparent"
          >
            Reset All Settings
          </Button>
          <Button
            variant="outline"
            className="w-full text-red-600 border-red-300 hover:bg-red-50 bg-transparent"
          >
            Clear All Data
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  const renderBillingDetails = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Billing Details</h2>
          <p className="text-sm text-gray-600">{selectedDropZone}</p>
        </div>
        <Button
          variant="ghost"
          onClick={() => setShowBillingDetails(false)}
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Settings
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Drop Zone Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="dzAddress">Billing Address *</Label>
            <Textarea
              id="dzAddress"
              value={dropZoneDetails.address}
              onChange={(e) => setDropZoneDetails((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="Drop zone billing address&#10;Street Address&#10;City, State/Province&#10;Country"
              className="min-h-[100px]"
            />
            <p className="text-xs text-gray-500 mt-1">Full address as it should appear on invoices</p>
          </div>

          <div>
            <Label htmlFor="financeContact">Finance Contact *</Label>
            <Input
              id="financeContact"
              value={dropZoneDetails.financeContact}
              onChange={(e) => setDropZoneDetails((prev) => ({ ...prev, financeContact: e.target.value }))}
              placeholder="Finance department contact name"
            />
            <p className="text-xs text-gray-500 mt-1">Person responsible for processing invoices</p>
          </div>

          <div>
            <Label htmlFor="financeEmail">Finance Email *</Label>
            <Input
              id="financeEmail"
              type="email"
              value={dropZoneDetails.financeEmail}
              onChange={(e) => setDropZoneDetails((prev) => ({ ...prev, financeEmail: e.target.value }))}
              placeholder="finance@dropzone.com"
            />
            <p className="text-xs text-gray-500 mt-1">Email address for sending invoices</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Button
          onClick={() => {
            if (
              !dropZoneDetails.address.trim() ||
              !dropZoneDetails.financeContact.trim() ||
              !dropZoneDetails.financeEmail.trim()
            ) {
              alert("Please fill in all required fields")
              return
            }
            handleSaveDropZone()
            setShowBillingDetails(false)
            setActiveSection("invoice")
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
          disabled={
            !dropZoneDetails.address.trim() ||
            !dropZoneDetails.financeContact.trim() ||
            !dropZoneDetails.financeEmail.trim()
          }
        >
          Save Billing Details
        </Button>

        <Button 
          onClick={() => {
            setShowBillingDetails(false)
            setActiveSection("invoice")
          }} 
          variant="outline" 
          className="w-full py-3 bg-transparent"
        >
          Cancel
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-md mx-auto">
        {showBillingDetails ? (
          renderBillingDetails()
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            </div>

            {/* Render based on active section */}
            {activeSection === "main" && renderMainMenu()}
            {activeSection === "profile" && renderProfileSection()}
            {activeSection === "invoice" && renderInvoiceSection()}
            {activeSection === "logbook" && renderLogbookSection()}
            {activeSection === "gear" && renderGearSection()}
            {activeSection === "experience" && renderExperienceSection()}
            {activeSection === "data" && renderDataSection()}
          </>
        )}
      </div>
    </div>
  )
}