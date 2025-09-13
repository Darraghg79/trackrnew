"use client"

import type React from "react"
import { useState } from "react"
import { Label } from "@/components/ui/label"

interface SearchableDropdownProps {
  value: string
  onValueChange: (value: string) => void
  options: string[]
  placeholder: string
  label: string
  error?: string | boolean
  className?: string // Add className prop
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  value,
  onValueChange,
  options = [], // Add default empty array
  placeholder,
  label,
  error,
  className,
}) => {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  // Add safety checks for options
  const safeOptions = options || []
  const filteredOptions = safeOptions.filter(
    (option) => option && typeof option === "string" && option.toLowerCase().includes(searchValue.toLowerCase()),
  )

  const selectOption = (option: string) => {
    onValueChange(option)
    setOpen(false)
    setSearchValue("")
  }

  return (
    <div className="space-y-2">
      {label && <Label className="text-sm font-medium text-gray-700">{label}</Label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`w-full min-h-[44px] px-3 py-2 text-left border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? "border-red-500" : "border-gray-300"
          } ${className || ""}`}
        >
          {value || placeholder}
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2">🔍</span>
        </button>
        {open && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            <input
              type="text"
              placeholder={`Search ${label ? label.toLowerCase() : "options"}...`}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full p-2 border-b border-gray-200 focus:outline-none"
            />
            {filteredOptions.length === 0 ? (
              <div className="p-2 text-gray-500">No options found</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => selectOption(option)}
                  className="w-full p-2 text-left hover:bg-gray-100 min-h-[44px] flex items-center"
                >
                  {option}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
