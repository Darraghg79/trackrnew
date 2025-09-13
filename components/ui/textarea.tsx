import type React from "react"
import type { TextareaProps } from "@/types/ui"

export const Textarea: React.FC<TextareaProps> = ({ className, ...props }) => (
  <textarea
    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${className || ""}`}
    {...props}
  />
)
