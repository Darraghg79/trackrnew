export interface JumpCountAudit {
  id: string
  timestamp: Date
  previousCount: number
  newCount: number
  reason: string
  userNote?: string
}

export interface FreefallTimeAudit {
  id: string
  timestamp: Date
  previousTime: number
  newTime: number
  reason: string
  userNote?: string
}

export interface AppSettings {
  currentJumpNumber: number
  jumpCountAuditLog: JumpCountAudit[]
  currentFreefallTime: number // Total freefall time in seconds
  freefallTimeAuditLog: FreefallTimeAudit[]
  units: "feet" | "meters" // Add units setting
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD" // Add date format setting
}
