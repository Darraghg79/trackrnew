import type React from "react"
import type { IconProps } from "@/types/ui"

export const JumpsIcon: React.FC<IconProps> = ({ className = "", size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12 2C8.5 2 5.5 4.5 5.5 7.5C5.5 8.5 6 9.5 7 10L12 22L17 10C18 9.5 18.5 8.5 18.5 7.5C18.5 4.5 15.5 2 12 2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path d="M7 10L12 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M17 10L12 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 10L12 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="18" r="1.5" stroke="currentColor" strokeWidth="1.5" fill="currentColor" />
  </svg>
)
