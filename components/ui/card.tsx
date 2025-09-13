import type React from "react"
import type { CardProps } from "@/types/ui"

export const Card: React.FC<CardProps> = ({ children, className }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className || ""}`}>{children}</div>
)

export const CardHeader: React.FC<CardProps> = ({ children, className }) => (
  <div className={`px-6 py-4 border-b border-gray-200 ${className || ""}`}>{children}</div>
)

export const CardTitle: React.FC<CardProps> = ({ children, className }) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className || ""}`}>{children}</h3>
)

export const CardContent: React.FC<CardProps> = ({ children, className }) => (
  <div className={`px-6 py-4 ${className || ""}`}>{children}</div>
)
