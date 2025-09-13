import type React from "react"
import type { InputProps } from "@/types/ui"

export const Input: React.FC<InputProps> = ({ className, error, ...props }) => (
  <input
    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
      error ? "border-red-500" : ""
    } ${className || ""}`}
    {...props}
  />
)
