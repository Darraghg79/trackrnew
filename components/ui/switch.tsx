"use client"

import type React from "react"
import type { SwitchProps } from "@/types/ui"

export const Switch: React.FC<SwitchProps> = ({ checked, onCheckedChange, className }) => (
  <button
    type="button"
    onClick={() => onCheckedChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      checked ? "bg-blue-600" : "bg-gray-200"
    } ${className || ""}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
)
