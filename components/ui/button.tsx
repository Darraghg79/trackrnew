"use client"

import type React from "react"
import type { ButtonProps } from "@/types/ui"

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled,
  className,
  variant = "default",
  type = "button",
  ...props
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-md font-medium transition-colors ${
      variant === "outline"
        ? "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        : variant === "ghost"
          ? "text-gray-700 hover:bg-gray-100"
          : "bg-blue-600 text-white hover:bg-blue-700"
    } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className || ""}`}
    {...props}
  >
    {children}
  </button>
)
