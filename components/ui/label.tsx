"use client"

import type * as React from "react"
import type { LabelProps } from "@/types/ui"
import { cn } from "@/lib/utils"

const labelVariants = cn(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  "block text-sm font-medium text-gray-700 mb-1",
)

const Label: React.FC<LabelProps> = ({ children, htmlFor, className }) => (
  <label htmlFor={htmlFor} className={cn(labelVariants, className)}>
    {children}
  </label>
)

export { Label }
