"use client"

import type React from "react"
import { useState } from "react"
import { Label } from "@/components/ui/label"
import type { GearOption } from "@/types/gear"

interface GearSelectionDropdownProps {
  values: string[]
  onValuesChange: (values: string[]) => void
  gearOptions: GearOption[]
  placeholder: string
  label: string
  error?: string | boolean
}

export const GearSelectionDropdown: React.FC<GearSelectionDropdownProps> = ({
  values,
  onValuesChange,
  gearOptions = [], // Add default empty array
  placeholder,
  label,
  error,
}) => {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  // Add safety check
  const safeGearOptions = gearOptions || []

  // Filter options based on search
  const filteredOptions = safeGearOptions.filter((option) =>
    option.name.toLowerCase().includes(searchValue.toLowerCase()),
  )

  // Group options by type (group vs individual items)
  const groupedOptions = filteredOptions.reduce(
    (acc, option) => {
      if (option.type === "group") {
        acc.groups.push(option)
      } else {
        acc.items.push(option)
      }
      return acc
    },
    { groups: [] as GearOption[], items: [] as GearOption[] },
  )

  const toggleGroup = (group: GearOption) => {
    const groupItemNames = group.itemIds // These are already the item names from the gear options
    const allGroupItemsSelected = groupItemNames.every((itemName) => values.includes(itemName))

    if (allGroupItemsSelected) {
      // Deselect all items in the group
      const newValues = values.filter((value) => !groupItemNames.includes(value))
      onValuesChange(newValues)
    } else {
      // Select all items in the group
      const newValues = [...new Set([...values, ...groupItemNames])]
      onValuesChange(newValues)
    }
  }

  const toggleItem = (itemName: string) => {
    const newValues = values.includes(itemName) ? values.filter((v) => v !== itemName) : [...values, itemName]
    onValuesChange(newValues)
  }

  const isGroupFullySelected = (group: GearOption) => {
    return group.itemIds.every((itemName) => values.includes(itemName))
  }

  const isGroupPartiallySelected = (group: GearOption) => {
    return group.itemIds.some((itemName) => values.includes(itemName)) && !isGroupFullySelected(group)
  }

  const getDisplayText = () => {
    if (values.length === 0) return placeholder

    // Show selected groups and individual items
    const selectedGroups: string[] = []
    const selectedIndividualItems: string[] = []

    // Check which groups are fully selected
    groupedOptions.groups.forEach((group) => {
      if (isGroupFullySelected(group)) {
        selectedGroups.push(group.name)
      } else if (isGroupPartiallySelected(group)) {
        // Show individual items from partially selected groups
        group.itemIds.forEach((itemName) => {
          if (values.includes(itemName)) {
            selectedIndividualItems.push(itemName)
          }
        })
      }
    })

    // Add individual items that aren't in any group
    groupedOptions.items.forEach((item) => {
      if (values.includes(item.name)) {
        selectedIndividualItems.push(item.name)
      }
    })

    const displayItems = [...selectedGroups, ...selectedIndividualItems]
    return displayItems.join(", ")
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`w-full min-h-[44px] px-3 py-2 text-left border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? "border-red-500" : "border-gray-300"
          }`}
        >
          <span className="block truncate">{getDisplayText()}</span>
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2">▼</span>
        </button>

        {open && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-auto">
            <input
              type="text"
              placeholder={`Search ${label.toLowerCase()}...`}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full p-2 border-b border-gray-200 focus:outline-none"
            />

            <div className="py-1">
              {/* Render Groups */}
              {groupedOptions.groups.map((group) => {
                const isFullySelected = isGroupFullySelected(group)
                const isPartiallySelected = isGroupPartiallySelected(group)

                return (
                  <div key={group.id} className="border-b border-gray-100 last:border-b-0">
                    {/* Group Header */}
                    <div
                      onClick={() => toggleGroup(group)}
                      className={`w-full p-3 text-left hover:bg-gray-100 cursor-pointer flex items-center justify-between font-medium ${
                        isFullySelected
                          ? "bg-blue-50 text-blue-700"
                          : isPartiallySelected
                            ? "bg-blue-25 text-blue-600"
                            : ""
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={isFullySelected}
                          ref={(input) => {
                            if (input) input.indeterminate = isPartiallySelected
                          }}
                          onChange={() => {}} // Handled by onClick
                          className="mr-2"
                        />
                        <span className="font-semibold">{group.name}</span>
                        <span className="text-xs text-gray-500">({group.itemIds.length} items)</span>
                      </div>
                      <span className="text-xs text-gray-400">GROUP</span>
                    </div>

                    {/* Group Items */}
                    <div className="pl-6 bg-gray-50">
                      {group.itemIds.map((itemName) => (
                        <div
                          key={itemName}
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleItem(itemName)
                          }}
                          className={`w-full p-2 text-left hover:bg-gray-100 cursor-pointer flex items-center text-sm ${
                            values.includes(itemName) ? "bg-blue-50 text-blue-700" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={values.includes(itemName)}
                            onChange={() => {}} // Handled by onClick
                            className="mr-2"
                          />
                          <span>• {itemName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

              {/* Render Individual Items */}
              {groupedOptions.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleItem(item.name)}
                  className={`w-full p-3 text-left hover:bg-gray-100 cursor-pointer flex items-center ${
                    values.includes(item.name) ? "bg-blue-50 text-blue-700" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={values.includes(item.name)}
                    onChange={() => {}} // Handled by onClick
                    className="mr-2"
                  />
                  <span>{item.name}</span>
                </div>
              ))}

              {filteredOptions.length === 0 && <div className="p-3 text-gray-500 text-center">No gear found</div>}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
