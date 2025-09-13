import type React from "react"
import type { IconProps } from "@/types/ui"

export const PreferencesIcon: React.FC<IconProps> = ({ className = "", size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M4 6H20M4 12H20M4 18H20"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="7" cy="6" r="2" stroke="currentColor" strokeWidth="2" fill="none" />
    <circle cx="17" cy="12" r="2" stroke="currentColor" strokeWidth="2" fill="none" />
    <circle cx="7" cy="18" r="2" stroke="currentColor" strokeWidth="2" fill="none" />
  </svg>
)
