"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { SearchableDropdown } from "@/components/searchable-dropdown"
import { MultiSelectDropdown } from "@/components/multi-select-dropdown"
import { GearSelectionDropdown } from "@/components/gear-selection-dropdown"
import type { JumpRecord, RateAtTimeOfJump } from "@/types/jump-record"
import type { InvoiceSettings } from "@/types/invoice"
import type { AppSettings } from "@/types/settings"
import type { GearOption } from "@/types/gear"

interface JumpEntryFormProps {
  onClose: () => void
  onSave: (jumpData: JumpRecord) => void
  initialData?: Partial<JumpRecord> | null
  existingJumps: JumpRecord[]
  lastJumpData: JumpRecord | null
  dropZoneOptions: string[]
  aircraftOptions: string[]
  jumpTypeOptions: string[]
  gearOptions: GearOption[]
  invoiceSettings: InvoiceSettings
  currentJumpNumber: number
  appSettings: AppSettings
}

export const JumpEntryForm: React.FC<JumpEntryFormProps> = ({
  onClose,
  onSave,
  initialData,
  existingJumps,
  lastJumpData,
  dropZoneOptions,
  aircraftOptions,
  jumpTypeOptions,
  gearOptions,
  invoiceSettings,
  currentJumpNumber,
  appSettings,
}) => {
  const isEditing = !!initialData?.jumpNumber
  const nextJumpNumber = isEditing ? initialData.jumpNumber! : currentJumpNumber + 1

  // Calculate freefall time based on altitude difference
  const calculateFreefallTime = (exitAlt: number, deployAlt: number): number => {
    if (!exitAlt || !deployAlt || deployAlt >= exitAlt) return 0
    
    const altitudeDifference = exitAlt - deployAlt
    
    // Convert to feet if using meters (1000ft = ~305m)
    const altInFeet = appSettings.units === "meters" ? altitudeDifference * 3.28084 : altitudeDifference
    
    // First 1000ft = 10 seconds, then 5 seconds per 1000ft thereafter
    if (altInFeet <= 1000) {
      return Math.round((altInFeet / 1000) * 10)
    } else {
      const firstThousand = 10 // 10 seconds for first 1000ft
      const remaining = altInFeet - 1000
      const additionalTime = (remaining / 1000) * 5 // 5 seconds per 1000ft thereafter
      return Math.round(firstThousand + additionalTime)
    }
  }

  // Initialize form data with smart defaults from last jump
  const getInitialFormData = (): Partial<JumpRecord> => {
    if (initialData) {
      return initialData
    }

    // Smart defaults from last jump
    if (lastJumpData) {
      const exitAlt = lastJumpData.exitAltitude
      const deployAlt = lastJumpData.deploymentAltitude
      const calculatedFreefallTime = calculateFreefallTime(exitAlt, deployAlt)
      
      return {
        jumpNumber: nextJumpNumber,
        date: new Date(),
        dropZone: lastJumpData.dropZone,
        aircraft: lastJumpData.aircraft,
        jumpType: lastJumpData.jumpType,
        exitAltitude: exitAlt,
        deploymentAltitude: deployAlt,
        freefallTime: calculatedFreefallTime,
        gearUsed: lastJumpData.gearUsed || [],
        workJump: false,
        customerName: "",
        invoiceItems: [],
        notes: "",
      }
    }

    // Default values for first jump
    return {
      jumpNumber: nextJumpNumber,
      date: new Date(),
      dropZone: "",
      aircraft: "",
      jumpType: "",
      exitAltitude: 0,
      deploymentAltitude: 0,
      freefallTime: 0,
      gearUsed: [],
      workJump: false,
      customerName: "",
      invoiceItems: [],
      notes: "",
    }
  }

  const [formData, setFormData] = useState<Partial<JumpRecord>>(getInitialFormData())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [userModifiedFreefallTime, setUserModifiedFreefallTime] = useState(false)

  // Available invoice services from settings
  const availableServices = Object.keys(invoiceSettings.rates)

  // Recalculate freefall time when altitudes change (only if user hasn't manually modified it)
  useEffect(() => {
    if (formData.exitAltitude && formData.deploymentAltitude && !userModifiedFreefallTime) {
      const calculatedTime = calculateFreefallTime(formData.exitAltitude, formData.deploymentAltitude)
      setFormData(prev => ({ ...prev, freefallTime: calculatedTime }))
    }
  }, [formData.exitAltitude, formData.deploymentAltitude, appSettings.units, userModifiedFreefallTime])

  const handleInputChange = (field: keyof JumpRecord, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    
    // Track if user manually modified freefall time
    if (field === 'freefallTime') {
      setUserModifiedFreefallTime(true)
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.dropZone?.trim()) {
      newErrors.dropZone = "Drop zone is required"
    }
    if (!formData.aircraft?.trim()) {
      newErrors.aircraft = "Aircraft is required"
    }
    if (!formData.jumpType?.trim()) {
      newErrors.jumpType = "Jump type is required"
    }
    if (!formData.exitAltitude || formData.exitAltitude <= 0) {
      newErrors.exitAltitude = "Exit altitude must be greater than 0"
    }
    if (!formData.deploymentAltitude || formData.deploymentAltitude <= 0) {
      newErrors.deploymentAltitude = "Deployment altitude must be greater than 0"
    }
    if (formData.deploymentAltitude && formData.exitAltitude && formData.deploymentAltitude >= formData.exitAltitude) {
      newErrors.deploymentAltitude = "Deployment altitude must be less than exit altitude"
    }
    if (!formData.freefallTime || formData.freefallTime <= 0) {
      newErrors.freefallTime = "Freefall time must be greater than 0"
    }
    if (formData.workJump && !formData.customerName?.trim()) {
      newErrors.customerName = "Customer name is required for work jumps"
    }
    if (formData.workJump && (!formData.invoiceItems || formData.invoiceItems.length === 0)) {
      newErrors.invoiceItems = "At least one service is required for work jumps"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Store current rates with the jump for work jumps
    let rateAtTimeOfJump: RateAtTimeOfJump[] = []
    if (formData.workJump && formData.invoiceItems && formData.invoiceItems.length > 0) {
      rateAtTimeOfJump = formData.invoiceItems.map(service => ({
        service,
        rate: invoiceSettings.rates[service] || 0
      }))
    }

    const jumpData: JumpRecord = {
      jumpNumber: formData.jumpNumber!,
      date: formData.date!,
      dropZone: formData.dropZone!,
      aircraft: formData.aircraft!,
      jumpType: formData.jumpType!,
      exitAltitude: formData.exitAltitude!,
      deploymentAltitude: formData.deploymentAltitude!,
      freefallTime: formData.freefallTime!,
      gearUsed: formData.gearUsed || [],
      cutaway: formData.cutaway || false,
      landingDistance: formData.landingDistance || 0,
      workJump: formData.workJump || false,
      customerName: formData.customerName || "",
      invoiceItems: formData.invoiceItems || [],
      rateAtTimeOfJump: rateAtTimeOfJump.length > 0 ? rateAtTimeOfJump : undefined,
      notes: formData.notes || "",
      lastEditDate: new Date(),
    }

    onSave(jumpData)
  }

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split("T")[0]
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? `Edit Jump #${formData.jumpNumber}` : `Add Jump #${nextJumpNumber}`}
            </h2>
            <Button variant="ghost" onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {/* Basic Jump Info */}
          <Card>
            <CardHeader>
              <CardTitle>Jump Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="jumpNumber">Jump Number</Label>
                  <Input
                    id="jumpNumber"
                    type="number"
                    value={formData.jumpNumber || ""}
                    disabled
                    className="bg-gray-100 text-gray-600"
                  />
                </div>

                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date ? formatDateForInput(formData.date) : ""}
                    onChange={(e) => handleInputChange("date", new Date(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <SearchableDropdown
                  options={dropZoneOptions}
                  value={formData.dropZone || ""}
                  onValueChange={(value) => handleInputChange("dropZone", value)}
                  placeholder="Select or type drop zone"
                  label="Drop Zone"
                  error={errors.dropZone}
                />
                {errors.dropZone && <p className="text-red-500 text-xs mt-1">{errors.dropZone}</p>}
              </div>

              <div>
                <SearchableDropdown
                  options={aircraftOptions}
                  value={formData.aircraft || ""}
                  onValueChange={(value) => handleInputChange("aircraft", value)}
                  placeholder="Select or type aircraft"
                  label="Aircraft"
                  error={errors.aircraft}
                />
                {errors.aircraft && <p className="text-red-500 text-xs mt-1">{errors.aircraft}</p>}
              </div>

              <div>
                <SearchableDropdown
                  options={jumpTypeOptions}
                  value={formData.jumpType || ""}
                  onValueChange={(value) => handleInputChange("jumpType", value)}
                  placeholder="Select or type jump type"
                  label="Jump Type"
                  error={errors.jumpType}
                />
                {errors.jumpType && <p className="text-red-500 text-xs mt-1">{errors.jumpType}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Altitude & Time */}
          <Card>
            <CardHeader>
              <CardTitle>Altitude & Time</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="exitAltitude">Exit Altitude ({appSettings.units === "feet" ? "ft" : "m"})</Label>
                  <Input
                    id="exitAltitude"
                    type="number"
                    value={formData.exitAltitude || ""}
                    onChange={(e) => handleInputChange("exitAltitude", Number.parseInt(e.target.value) || 0)}
                    className={errors.exitAltitude ? "border-red-500" : ""}
                  />
                  {errors.exitAltitude && <p className="text-red-500 text-xs mt-1">{errors.exitAltitude}</p>}
                </div>

                <div>
                  <Label htmlFor="deploymentAltitude">
                    Deployment Altitude ({appSettings.units === "feet" ? "ft" : "m"})
                  </Label>
                  <Input
                    id="deploymentAltitude"
                    type="number"
                    value={formData.deploymentAltitude || ""}
                    onChange={(e) => handleInputChange("deploymentAltitude", Number.parseInt(e.target.value) || 0)}
                    className={errors.deploymentAltitude ? "border-red-500" : ""}
                  />
                  {errors.deploymentAltitude && (
                    <p className="text-red-500 text-xs mt-1">{errors.deploymentAltitude}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="freefallTime">Freefall Time (seconds)</Label>
                <Input
                  id="freefallTime"
                  type="number"
                  value={formData.freefallTime || ""}
                  onChange={(e) => handleInputChange("freefallTime", Number.parseInt(e.target.value) || 0)}
                  className={errors.freefallTime ? "border-red-500" : ""}
                />
                {errors.freefallTime && <p className="text-red-500 text-xs mt-1">{errors.freefallTime}</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gear Used</CardTitle>
            </CardHeader>
            <CardContent>
              <GearSelectionDropdown
                values={formData.gearUsed || []}
                onValuesChange={(values) => handleInputChange("gearUsed", values)}
                gearOptions={gearOptions}
                placeholder="Select gear used (optional)"
                label="Gear Used"
                error={errors.gearUsed}
              />
            </CardContent>
          </Card>

          {/* Work Jump */}
          <Card>
            <CardHeader>
              <CardTitle>Work Jump</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="workJump"
                  checked={formData.workJump || false}
                  onCheckedChange={(checked) => {
                    handleInputChange("workJump", checked)
                    if (!checked) {
                      handleInputChange("customerName", "")
                      handleInputChange("invoiceItems", [])
                    }
                  }}
                />
                <Label htmlFor="workJump">This is a work jump</Label>
              </div>

              {formData.workJump && (
                <>
                  <div>
                    <Label htmlFor="customerName">Customer Name</Label>
                    <Input
                      id="customerName"
                      value={formData.customerName || ""}
                      onChange={(e) => handleInputChange("customerName", e.target.value)}
                      placeholder="Customer name"
                      className={errors.customerName ? "border-red-500" : ""}
                    />
                    {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName}</p>}
                  </div>

                  <div>
                    <MultiSelectDropdown
                      values={formData.invoiceItems || []}
                      onValuesChange={(items) => handleInputChange("invoiceItems", items)}
                      options={availableServices}
                      placeholder="Select services"
                      label="Services"
                      error={errors.invoiceItems}
                    />
                    {errors.invoiceItems && <p className="text-red-500 text-xs mt-1">{errors.invoiceItems}</p>}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes || ""}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Additional notes about this jump"
                className="min-h-[80px]"
              />
            </CardContent>
          </Card>

          {/* Signature Display */}
          {initialData?.signature && (
            <Card>
              <CardHeader>
                <CardTitle>Digital Signature</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500">License Number:</span>
                    <p className="font-medium">{initialData.signature.licenceNumber}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Signed Date:</span>
                    <p className="font-medium">{new Date(initialData.signature.signedDate).toLocaleDateString()}</p>
                  </div>
                  {initialData.signature.signedBy && (
                    <div>
                      <span className="text-sm text-gray-500">Signed By:</span>
                      <p className="font-medium">{initialData.signature.signedBy}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-gray-500">Signature:</span>
                    <div className="mt-2 border rounded-lg p-2 bg-gray-50">
                      <img
                        src={initialData.signature.signatureData || "/placeholder.svg"}
                        alt="Digital signature"
                        className="max-w-full h-auto max-h-32 mx-auto"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Form Actions */}
          <div className="flex space-x-3 pt-4">
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
              {isEditing ? "Update Jump" : "Save Jump"}
            </Button>
            <Button type="button" onClick={onClose} variant="outline" className="flex-1 bg-transparent">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
