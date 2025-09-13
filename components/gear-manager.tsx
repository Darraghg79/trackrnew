"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { SearchableDropdown } from "@/components/searchable-dropdown"
import { MultiSelectDropdown } from "@/components/multi-select-dropdown"
import type { GearItem, GearGroup, GearServiceReminder, GearOption } from "@/types/gear"

interface GearManagerProps {
  gearItems: GearItem[]
  gearGroups: GearGroup[]
  onUpdateGearItems: (items: GearItem[]) => void
  onUpdateGearGroups: (groups: GearGroup[]) => void
  onUpdateGearOptions: (options: GearOption[]) => void
}

export const GearManager: React.FC<GearManagerProps> = ({
  gearItems,
  gearGroups,
  onUpdateGearItems,
  onUpdateGearGroups,
  onUpdateGearOptions,
}) => {
  const [showAddForm, setShowAddForm] = useState(false)
  const [showGroupForm, setShowGroupForm] = useState(false)
  const [editingGear, setEditingGear] = useState<GearItem | null>(null)
  const [editingGroup, setEditingGroup] = useState<GearGroup | null>(null)
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "archived">("active")
  const [activeTab, setActiveTab] = useState<"items" | "groups">("items")

  const [newGear, setNewGear] = useState({
    name: "",
    serialNumber: "",
    type: "main" as const,
    requiresService: false,
    nextServiceDate: "",
    notes: "",
  })

  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    selectedItems: [] as string[],
  })

  const gearTypeOptions = [
    { value: "main", label: "Main Canopy" },
    { value: "reserve", label: "Reserve Canopy" },
    { value: "aad", label: "AAD (Automatic Activation Device)" },
    { value: "other", label: "Other Equipment" },
  ]

  // Calculate service reminders
  const serviceReminders = useMemo((): GearServiceReminder[] => {
    const today = new Date()
    const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    return gearItems
      .filter((item) => item.isActive && item.requiresService && item.nextServiceDate)
      .map((item) => {
        const nextServiceDate = new Date(item.nextServiceDate!)
        const timeDiff = nextServiceDate.getTime() - today.getTime()
        const daysUntilDue = Math.ceil(timeDiff / (1000 * 3600 * 24))

        return {
          gearId: item.id,
          gearName: item.name,
          nextServiceDate,
          isOverdue: nextServiceDate < today,
          daysUntilDue,
        }
      })
      .filter((reminder) => reminder.isOverdue || reminder.nextServiceDate <= oneWeekFromNow)
      .sort((a, b) => a.nextServiceDate.getTime() - b.nextServiceDate.getTime())
  }, [gearItems])

  // Update gear options whenever items or groups change
  const updateGearOptions = (items: GearItem[], groups: GearGroup[]) => {
    const options: GearOption[] = []

    // Add active groups first
    groups
      .filter((group) => group.isActive)
      .forEach((group) => {
        const activeGroupItems = items.filter((item) => group.itemIds.includes(item.id) && item.isActive)
        if (activeGroupItems.length > 0) {
          options.push({
            id: group.id,
            name: group.name,
            type: "group",
            itemIds: activeGroupItems.map((item) => item.name), // Use item names, not IDs
          })
        }
      })

    // Add ungrouped active items
    const groupedItemIds = new Set(groups.flatMap((group) => group.itemIds))
    items
      .filter((item) => item.isActive && !groupedItemIds.has(item.id))
      .forEach((item) => {
        options.push({
          id: item.id,
          name: item.name,
          type: "item",
          itemIds: [item.name], // Use item name, not ID
        })
      })

    onUpdateGearOptions(options)
  }

  const filteredGearItems = useMemo(() => {
    return gearItems.filter((item) => {
      if (activeFilter === "active") return item.isActive
      if (activeFilter === "archived") return !item.isActive
      return true
    })
  }, [gearItems, activeFilter])

  const filteredGearGroups = useMemo(() => {
    return gearGroups.filter((group) => {
      if (activeFilter === "active") return group.isActive
      if (activeFilter === "archived") return !group.isActive
      return true
    })
  }, [gearGroups, activeFilter])

  const handleAddGear = () => {
    if (!newGear.name.trim()) {
      alert("Gear name is required")
      return
    }

    const gearItem: GearItem = {
      id: `gear_${Date.now()}`,
      name: newGear.name.trim(),
      serialNumber: newGear.serialNumber.trim() || undefined,
      type: newGear.type,
      isActive: true,
      requiresService: newGear.requiresService,
      nextServiceDate: newGear.nextServiceDate ? new Date(newGear.nextServiceDate) : undefined,
      notes: newGear.notes.trim() || undefined,
      createdDate: new Date(),
    }

    const updatedGearItems = [...gearItems, gearItem]
    onUpdateGearItems(updatedGearItems)
    updateGearOptions(updatedGearItems, gearGroups)

    // Reset form
    setNewGear({
      name: "",
      serialNumber: "",
      type: "main",
      requiresService: false,
      nextServiceDate: "",
      notes: "",
    })
    setShowAddForm(false)
  }

  const handleAddGroup = () => {
    if (!newGroup.name.trim()) {
      alert("Group name is required")
      return
    }

    if (newGroup.selectedItems.length === 0) {
      alert("Please select at least one item for the group")
      return
    }

    // Convert selected item display names back to item IDs
    const selectedItemIds = newGroup.selectedItems
      .map((displayName) => {
        const itemName = displayName.split(" (")[0] // Remove the type part
        const item = gearItems.find((item) => item.name === itemName)
        return item?.id
      })
      .filter(Boolean) as string[]

    const group: GearGroup = {
      id: `group_${Date.now()}`,
      name: newGroup.name.trim(),
      description: newGroup.description.trim() || undefined,
      itemIds: selectedItemIds,
      isActive: true,
      createdDate: new Date(),
    }

    const updatedGroups = [...gearGroups, group]
    onUpdateGearGroups(updatedGroups)
    updateGearOptions(gearItems, updatedGroups)

    // Reset form
    setNewGroup({
      name: "",
      description: "",
      selectedItems: [],
    })
    setShowGroupForm(false)
  }

  const handleUpdateGear = () => {
    if (!editingGear || !newGear.name.trim()) {
      alert("Gear name is required")
      return
    }

    const updatedGear: GearItem = {
      ...editingGear,
      name: newGear.name.trim(),
      serialNumber: newGear.serialNumber.trim() || undefined,
      type: newGear.type,
      requiresService: newGear.requiresService,
      nextServiceDate: newGear.nextServiceDate ? new Date(newGear.nextServiceDate) : undefined,
      lastServiceDate:
        newGear.nextServiceDate &&
        editingGear.nextServiceDate &&
        new Date(newGear.nextServiceDate) > editingGear.nextServiceDate
          ? new Date()
          : editingGear.lastServiceDate,
      notes: newGear.notes.trim() || undefined,
    }

    const updatedGearItems = gearItems.map((item) => (item.id === editingGear.id ? updatedGear : item))
    onUpdateGearItems(updatedGearItems)
    updateGearOptions(updatedGearItems, gearGroups)

    // Reset form
    setNewGear({
      name: "",
      serialNumber: "",
      type: "main",
      requiresService: false,
      nextServiceDate: "",
      notes: "",
    })
    setShowAddForm(false)
    setEditingGear(null)
  }

  const handleToggleActiveItem = (gearId: string) => {
    const updatedGearItems = gearItems.map((item) =>
      item.id === gearId ? { ...item, isActive: !item.isActive } : item,
    )
    onUpdateGearItems(updatedGearItems)
    updateGearOptions(updatedGearItems, gearGroups)
  }

  const handleToggleActiveGroup = (groupId: string) => {
    const updatedGroups = gearGroups.map((group) =>
      group.id === groupId ? { ...group, isActive: !group.isActive } : group,
    )
    onUpdateGearGroups(updatedGroups)
    updateGearOptions(gearItems, updatedGroups)
  }

  const handleDeleteGear = (gearId: string) => {
    const gear = gearItems.find((item) => item.id === gearId)
    if (!gear) return

    if (confirm(`Delete "${gear.name}"? This action cannot be undone.`)) {
      const updatedGearItems = gearItems.filter((item) => item.id !== gearId)

      // Remove from any groups
      const updatedGroups = gearGroups.map((group) => ({
        ...group,
        itemIds: group.itemIds.filter((id) => id !== gearId),
      }))

      onUpdateGearItems(updatedGearItems)
      onUpdateGearGroups(updatedGroups)
      updateGearOptions(updatedGearItems, updatedGroups)
    }
  }

  const handleDeleteGroup = (groupId: string) => {
    const group = gearGroups.find((g) => g.id === groupId)
    if (!group) return

    if (confirm(`Delete group "${group.name}"? Items will remain but be ungrouped.`)) {
      const updatedGroups = gearGroups.filter((g) => g.id !== groupId)
      onUpdateGearGroups(updatedGroups)
      updateGearOptions(gearItems, updatedGroups)
    }
  }

  const getAvailableItemsForGroup = () => {
    const groupedItemIds = new Set(
      gearGroups.flatMap((group) =>
        editingGroup ? (group.id === editingGroup.id ? [] : group.itemIds) : group.itemIds,
      ),
    )
    return gearItems.filter((item) => item.isActive && !groupedItemIds.has(item.id))
  }

  const getTypeLabel = (type: string) => {
    return gearTypeOptions.find((option) => option.value === type)?.label || type
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-GB")
  }

  const getServiceStatus = (item: GearItem) => {
    if (!item.requiresService || !item.nextServiceDate) return null

    const today = new Date()
    const nextService = new Date(item.nextServiceDate)
    const daysUntilDue = Math.ceil((nextService.getTime() - today.getTime()) / (1000 * 3600 * 24))

    if (nextService < today) {
      return { status: "overdue", text: `Overdue by ${Math.abs(daysUntilDue)} days`, color: "text-red-600 bg-red-50" }
    } else if (daysUntilDue <= 7) {
      return { status: "due-soon", text: `Due in ${daysUntilDue} days`, color: "text-orange-600 bg-orange-50" }
    } else {
      return { status: "current", text: `Due ${formatDate(nextService)}`, color: "text-green-600 bg-green-50" }
    }
  }

  const renderItemsTab = () => (
    <div className="space-y-4">
      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="p-4 border rounded-md bg-gray-50 space-y-4">
          <h4 className="font-medium text-gray-900">{editingGear ? "Edit Gear" : "Add New Gear"}</h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gearName">Gear Name *</Label>
              <Input
                id="gearName"
                value={newGear.name}
                onChange={(e) => setNewGear((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Main Canopy, Reserve"
              />
            </div>
            <div>
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input
                id="serialNumber"
                value={newGear.serialNumber}
                onChange={(e) => setNewGear((prev) => ({ ...prev, serialNumber: e.target.value }))}
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="gearType">Equipment Type</Label>
            <SearchableDropdown
              value={getTypeLabel(newGear.type)}
              onValueChange={(value) => {
                const selectedType = gearTypeOptions.find((option) => option.label === value)
                if (selectedType) {
                  setNewGear((prev) => ({ ...prev, type: selectedType.value as any }))
                }
              }}
              options={gearTypeOptions.map((option) => option.label)}
              placeholder="Select equipment type"
              label=""
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Service/Repack Required</Label>
                <p className="text-sm text-gray-600">Track service dates and get reminders</p>
              </div>
              <Switch
                checked={newGear.requiresService}
                onCheckedChange={(checked) => setNewGear((prev) => ({ ...prev, requiresService: checked }))}
              />
            </div>

            {newGear.requiresService && (
              <div>
                <Label htmlFor="nextServiceDate">Next Service/Repack Date</Label>
                <Input
                  id="nextServiceDate"
                  type="date"
                  value={newGear.nextServiceDate}
                  onChange={(e) => setNewGear((prev) => ({ ...prev, nextServiceDate: e.target.value }))}
                  min={new Date().toISOString().split("T")[0]}
                />
                <p className="text-xs text-gray-500 mt-1">You'll receive a reminder 1 week before this date</p>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="gearNotes">Notes</Label>
            <Textarea
              id="gearNotes"
              value={newGear.notes}
              onChange={(e) => setNewGear((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about this gear..."
              className="min-h-[60px]"
            />
          </div>

          <div className="flex space-x-2">
            <Button onClick={editingGear ? handleUpdateGear : handleAddGear} className="flex-1">
              {editingGear ? "Update Gear" : "Add Gear"}
            </Button>
            <Button
              onClick={() => {
                setShowAddForm(false)
                setEditingGear(null)
                setNewGear({
                  name: "",
                  serialNumber: "",
                  type: "main",
                  requiresService: false,
                  nextServiceDate: "",
                  notes: "",
                })
              }}
              variant="outline"
              className="flex-1 bg-transparent"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Gear List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredGearItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No gear items found</p>
            <p className="text-sm">Add your first piece of skydiving equipment</p>
          </div>
        ) : (
          filteredGearItems.map((item) => {
            const serviceStatus = getServiceStatus(item)
            const isGrouped = gearGroups.some((group) => group.itemIds.includes(item.id))

            return (
              <div key={item.id} className="border rounded-md p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-lg">{item.name}</span>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {getTypeLabel(item.type)}
                      </span>
                      {!item.isActive && (
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Archived</span>
                      )}
                      {isGrouped && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Grouped</span>
                      )}
                    </div>

                    {item.serialNumber && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">S/N:</span> {item.serialNumber}
                      </p>
                    )}

                    {serviceStatus && (
                      <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${serviceStatus.color}`}>
                        {serviceStatus.text}
                      </div>
                    )}

                    {item.notes && <p className="text-sm text-gray-600 mt-2">{item.notes}</p>}
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <Button
                      onClick={() => {
                        setEditingGear(item)
                        setNewGear({
                          name: item.name,
                          serialNumber: item.serialNumber || "",
                          type: item.type,
                          requiresService: item.requiresService,
                          nextServiceDate: item.nextServiceDate ? item.nextServiceDate.toISOString().split("T")[0] : "",
                          notes: item.notes || "",
                        })
                        setShowAddForm(true)
                      }}
                      variant="ghost"
                      className="text-blue-600 hover:text-blue-800 px-2 py-1 h-auto text-sm"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleToggleActiveItem(item.id)}
                      variant="ghost"
                      className={`px-2 py-1 h-auto text-sm ${
                        item.isActive ? "text-orange-600 hover:text-orange-800" : "text-green-600 hover:text-green-800"
                      }`}
                    >
                      {item.isActive ? "Archive" : "Activate"}
                    </Button>
                    <Button
                      onClick={() => handleDeleteGear(item.id)}
                      variant="ghost"
                      className="text-red-600 hover:text-red-800 px-2 py-1 h-auto text-sm"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )

  const renderGroupsTab = () => (
    <div className="space-y-4">
      {/* Add Group Form */}
      {showGroupForm && (
        <div className="p-4 border rounded-md bg-gray-50 space-y-4">
          <h4 className="font-medium text-gray-900">Create Gear Group</h4>

          <div>
            <Label htmlFor="groupName">Group Name *</Label>
            <Input
              id="groupName"
              value={newGroup.name}
              onChange={(e) => setNewGroup((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Main Rig, Backup Rig"
            />
          </div>

          <div>
            <Label htmlFor="groupDescription">Description</Label>
            <Input
              id="groupDescription"
              value={newGroup.description}
              onChange={(e) => setNewGroup((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description"
            />
          </div>

          <div>
            <Label>Select Items for Group *</Label>
            <MultiSelectDropdown
              values={newGroup.selectedItems}
              onValuesChange={(values) => setNewGroup((prev) => ({ ...prev, selectedItems: values }))}
              options={getAvailableItemsForGroup().map((item) => `${item.name} (${getTypeLabel(item.type)})`)}
              placeholder="Select gear items"
              label=""
            />
            <p className="text-xs text-gray-500 mt-1">Only ungrouped active items are available</p>
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleAddGroup} className="flex-1">
              Create Group
            </Button>
            <Button
              onClick={() => {
                setShowGroupForm(false)
                setNewGroup({
                  name: "",
                  description: "",
                  selectedItems: [],
                })
              }}
              variant="outline"
              className="flex-1 bg-transparent"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Groups List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredGearGroups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No gear groups created</p>
            <p className="text-sm">Group related gear items together</p>
          </div>
        ) : (
          filteredGearGroups.map((group) => {
            const groupItems = gearItems.filter((item) => group.itemIds.includes(item.id))

            return (
              <div key={group.id} className="border rounded-md p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-lg">{group.name}</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {groupItems.length} items
                      </span>
                      {!group.isActive && (
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Archived</span>
                      )}
                    </div>

                    {group.description && <p className="text-sm text-gray-600 mb-2">{group.description}</p>}

                    <div className="space-y-1">
                      {groupItems.map((item) => (
                        <div key={item.id} className="text-sm text-gray-700 flex items-center space-x-2">
                          <span>• {item.name}</span>
                          <span className="text-xs text-gray-500">({getTypeLabel(item.type)})</span>
                          {!item.isActive && <span className="text-xs text-orange-600">(Archived)</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <Button
                      onClick={() => handleToggleActiveGroup(group.id)}
                      variant="ghost"
                      className={`px-2 py-1 h-auto text-sm ${
                        group.isActive ? "text-orange-600 hover:text-orange-800" : "text-green-600 hover:text-green-800"
                      }`}
                    >
                      {group.isActive ? "Archive" : "Activate"}
                    </Button>
                    <Button
                      onClick={() => handleDeleteGroup(group.id)}
                      variant="ghost"
                      className="text-red-600 hover:text-red-800 px-2 py-1 h-auto text-sm"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Gear Management</CardTitle>
            {serviceReminders.length > 0 && (
              <div className="flex items-center mt-2">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                <span className="text-sm text-red-600 font-medium">
                  {serviceReminders.length} service reminder{serviceReminders.length > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            {activeTab === "items" && (
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
              >
                {showAddForm ? "Cancel" : "+ Add Gear"}
              </Button>
            )}
            {activeTab === "groups" && (
              <Button
                onClick={() => setShowGroupForm(!showGroupForm)}
                className="bg-green-600 hover:bg-green-700 text-white text-sm"
              >
                {showGroupForm ? "Cancel" : "+ Create Group"}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Service Reminders */}
        {serviceReminders.length > 0 && (
          <div className="p-4 border border-red-200 rounded-md bg-red-50">
            <h4 className="font-medium text-red-800 mb-2">Service Reminders</h4>
            <div className="space-y-2">
              {serviceReminders.map((reminder) => (
                <div key={reminder.gearId} className="flex justify-between items-center text-sm">
                  <span className="font-medium text-red-700">{reminder.gearName}</span>
                  <span className={reminder.isOverdue ? "text-red-600" : "text-orange-600"}>
                    {reminder.isOverdue
                      ? `Overdue by ${Math.abs(reminder.daysUntilDue)} days`
                      : `Due in ${reminder.daysUntilDue} days`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("items")}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === "items" ? "bg-white text-blue-700 shadow-sm" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Items (
            {
              gearItems.filter(
                (item) => activeFilter === "all" || (activeFilter === "active" ? item.isActive : !item.isActive),
              ).length
            }
            )
          </button>
          <button
            onClick={() => setActiveTab("groups")}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === "groups" ? "bg-white text-blue-700 shadow-sm" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Groups (
            {
              gearGroups.filter(
                (group) => activeFilter === "all" || (activeFilter === "active" ? group.isActive : !group.isActive),
              ).length
            }
            )
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: "active", label: "Active" },
            { key: "archived", label: "Archived" },
            { key: "all", label: "All" },
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key as any)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeFilter === filter.key ? "bg-white text-blue-700 shadow-sm" : "text-gray-600 hover:text-gray-800"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "items" ? renderItemsTab() : renderGroupsTab()}

        {(gearItems.length > 0 || gearGroups.length > 0) && (
          <div className="pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              Items: {gearItems.length} total • Groups: {gearGroups.length} total
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
