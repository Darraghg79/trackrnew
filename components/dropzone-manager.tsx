"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import type { DropZone } from "@/types/dropzone"
import type { JumpRecord } from "@/types/jump-record"
import { searchDropZones } from "@/data/dropzone-database"

interface DropZoneManagerProps {
  dropZones: DropZone[]
  onUpdateDropZones: (dropZones: DropZone[]) => void
  onUpdateDropZoneOptions: (options: string[]) => void
  savedJumps: JumpRecord[]
  onUpdateJumpsDropZone: (oldDropZone: string, newDropZone: string) => void
}

export const DropZoneManager: React.FC<DropZoneManagerProps> = ({
  dropZones,
  onUpdateDropZones,
  onUpdateDropZoneOptions,
  savedJumps,
  onUpdateJumpsDropZone,
}) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [newDropZone, setNewDropZone] = useState({
    name: "",
    address: "",
    country: "",
    coordinates: { latitude: "", longitude: "" },
  })

  const filteredDropZones = searchQuery ? searchDropZones(searchQuery) : dropZones.slice(0, 50) // Show first 50 by default

  const handleAddDropZone = () => {
  // Validation
  if (!newDropZone.name || !newDropZone.country) {
    alert('Please fill in all required fields')
    return
  }

  // Check if dropzone name already exists (case-insensitive)
  const nameExists = dropZones.some(
    dz => dz.name.toLowerCase() === newDropZone.name.toLowerCase()
  )
  
  if (nameExists) {
    alert(`A drop zone called "${newDropZone.name}" already exists. Please choose a different name.`)
    return
  }


    const dropZone: DropZone = {
      id: `dz_user_${newDropZone.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
      name: newDropZone.name.trim(),
      address: newDropZone.address.trim(),
      country: newDropZone.country.trim() || "Unknown",
      continent: "Unknown", // Could be enhanced with geocoding
      isUserAdded: true,
      coordinates:
        newDropZone.coordinates.latitude && newDropZone.coordinates.longitude
          ? {
              latitude: Number.parseFloat(newDropZone.coordinates.latitude),
              longitude: Number.parseFloat(newDropZone.coordinates.longitude),
            }
          : undefined,
    }

    const updatedDropZones = [...dropZones, dropZone]
    onUpdateDropZones(updatedDropZones)

    // Reset form
    setNewDropZone({
      name: "",
      address: "",
      country: "",
      coordinates: { latitude: "", longitude: "" },
    })
    setShowAddForm(false)
  }

  const handleRemoveDropZone = (dropZoneId: string) => {
    const dropZone = dropZones.find((dz) => dz.id === dropZoneId)
    if (!dropZone) return

    if (!dropZone.isUserAdded) {
      alert("Cannot remove default dropzones from the database")
      return
    }

    if (confirm(`Remove "${dropZone.name}" from your dropzone list?`)) {
      const updatedDropZones = dropZones.filter((dz) => dz.id !== dropZoneId)
      onUpdateDropZones(updatedDropZones)
      onUpdateDropZoneOptions(updatedDropZones.map((dz) => dz.name))
    }
  }

  const handleEditDropZone = (dropZone: DropZone) => {
    const newName = prompt(`Edit dropzone name:`, dropZone.name)

    if (!newName || newName.trim() === dropZone.name) return

    const trimmedName = newName.trim()

    if (dropZones.some((dz) => dz.name === trimmedName && dz.id !== dropZone.id)) {
      alert("A dropzone with this name already exists.")
      return
    }

    // Check if this dropzone is used in any existing jumps
    const jumpsUsingDropZone = savedJumps.filter((jump) => jump.dropZone === dropZone.name)

    if (jumpsUsingDropZone.length > 0) {
      const confirmEdit = confirm(
        `"${dropZone.name}" is used in ${jumpsUsingDropZone.length} jump record(s). ` +
          `All records will be updated to use "${trimmedName}". Continue?`,
      )

      if (!confirmEdit) return

      // Update all jumps using this dropzone
      onUpdateJumpsDropZone(dropZone.name, trimmedName)

      alert(`Updated ${jumpsUsingDropZone.length} jump record(s) to use "${trimmedName}".`)
    }

    // Update the dropzone in the database
    const updatedDropZones = dropZones.map((dz) => (dz.id === dropZone.id ? { ...dz, name: trimmedName } : dz))
    onUpdateDropZones(updatedDropZones)
    onUpdateDropZoneOptions(updatedDropZones.map((dz) => dz.name))
  }

  const handleRemoveDropZoneEnhanced = (dropZone: DropZone) => {
    // Check if this dropzone is used in any existing jumps
    const jumpsUsingDropZone = savedJumps.filter((jump) => jump.dropZone === dropZone.name)

    if (jumpsUsingDropZone.length > 0) {
      const confirmDelete = confirm(
        `"${dropZone.name}" is used in ${jumpsUsingDropZone.length} jump record(s). ` +
          `If you delete it, you'll need to select a replacement dropzone for those jumps. Continue?`,
      )

      if (!confirmDelete) return

      // Show replacement dropzone selection
      const remainingDropZones = dropZones.filter((dz) => dz.id !== dropZone.id)
      if (remainingDropZones.length === 0) {
        alert("Cannot delete the last dropzone. Add another dropzone first.")
        return
      }

      const replacementOptions = remainingDropZones
        .slice(0, 10)
        .map((dz, i) => `${i + 1}. ${dz.name}`)
        .join("\n")
      const selection = prompt(
        `Select replacement dropzone for ${jumpsUsingDropZone.length} jump(s):\n\n${replacementOptions}\n\nEnter the number:`,
      )

      const selectedIndex = Number.parseInt(selection || "") - 1
      if (selectedIndex >= 0 && selectedIndex < Math.min(remainingDropZones.length, 10)) {
        const replacementDropZone = remainingDropZones[selectedIndex]

        // Update all jumps using this dropzone
        onUpdateJumpsDropZone(dropZone.name, replacementDropZone.name)

        // Remove the dropzone from database
        const updatedDropZones = dropZones.filter((dz) => dz.id !== dropZone.id)
        onUpdateDropZones(updatedDropZones)
        onUpdateDropZoneOptions(updatedDropZones.map((dz) => dz.name))

        alert(
          `Updated ${jumpsUsingDropZone.length} jump(s) to use "${replacementDropZone.name}" instead of "${dropZone.name}".`,
        )
      } else {
        alert("Invalid selection. Dropzone not deleted.")
      }
    } else {
      // No jumps using this dropzone, safe to delete
      if (confirm(`Remove "${dropZone.name}" from dropzone list?`)) {
        const updatedDropZones = dropZones.filter((dz) => dz.id !== dropZone.id)
        onUpdateDropZones(updatedDropZones)
        onUpdateDropZoneOptions(updatedDropZones.map((dz) => dz.name))
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Drop Zone Database</CardTitle>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
          >
            {showAddForm ? "Cancel" : "+ Add Custom"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div>
          <Label htmlFor="dzSearch">Search Drop Zones</Label>
          <Input
            id="dzSearch"
            placeholder="Search by name, country, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            {searchQuery
              ? `Found ${filteredDropZones.length} results`
              : `Showing first 50 of ${dropZones.length} dropzones`}
          </p>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="p-4 border rounded-md bg-gray-50 space-y-3">
            <h4 className="font-medium text-gray-900">Add Custom Drop Zone</h4>

            <div>
              <Label htmlFor="newName">Name *</Label>
              <Input
                id="newName"
                value={newDropZone.name}
                onChange={(e) => setNewDropZone((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Drop zone name"
              />
            </div>

            <div>
              <Label htmlFor="newAddress">Address *</Label>
              <Textarea
                id="newAddress"
                value={newDropZone.address}
                onChange={(e) => setNewDropZone((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Full address"
                className="min-h-[60px]"
              />
            </div>

            <div>
              <Label htmlFor="newCountry">Country</Label>
              <Input
                id="newCountry"
                value={newDropZone.country}
                onChange={(e) => setNewDropZone((prev) => ({ ...prev, country: e.target.value }))}
                placeholder="Country (optional)"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="newLat">Latitude</Label>
                <Input
                  id="newLat"
                  type="number"
                  step="any"
                  value={newDropZone.coordinates.latitude}
                  onChange={(e) =>
                    setNewDropZone((prev) => ({
                      ...prev,
                      coordinates: { ...prev.coordinates, latitude: e.target.value },
                    }))
                  }
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label htmlFor="newLng">Longitude</Label>
                <Input
                  id="newLng"
                  type="number"
                  step="any"
                  value={newDropZone.coordinates.longitude}
                  onChange={(e) =>
                    setNewDropZone((prev) => ({
                      ...prev,
                      coordinates: { ...prev.coordinates, longitude: e.target.value },
                    }))
                  }
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleAddDropZone} className="flex-1">
                Add Drop Zone
              </Button>
              <Button onClick={() => setShowAddForm(false)} variant="outline" className="flex-1 bg-transparent">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Drop Zone List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredDropZones.map((dz) => (
            <div key={dz.id} className="flex items-start justify-between p-3 border rounded-md">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium">{dz.name}</span>
                  {dz.isUserAdded && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Custom</span>
                  )}
                  {!dz.isUserAdded && (
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Database</span>
                  )}
                  {dz.coordinates && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">📍</span>}
                </div>
                <p className="text-sm text-gray-600">{dz.address}</p>
                <p className="text-xs text-gray-500">
                  {dz.country} • {dz.continent}
                  {dz.coordinates && (
                    <span className="ml-2">
                      ({dz.coordinates.latitude.toFixed(4)}, {dz.coordinates.longitude.toFixed(4)})
                    </span>
                  )}
                </p>
              </div>

              <div className="flex space-x-2 ml-2">
                <Button
                  onClick={() => handleEditDropZone(dz)}
                  variant="ghost"
                  className="text-blue-600 hover:text-blue-800 px-2 py-1 h-auto"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => handleRemoveDropZoneEnhanced(dz)}
                  variant="ghost"
                  className="text-red-600 hover:text-red-800 px-2 py-1 h-auto"
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filteredDropZones.length === 0 && searchQuery && (
          <div className="text-center py-4 text-gray-500">No dropzones found matching "{searchQuery}"</div>
        )}
      </CardContent>
    </Card>
  )
}
