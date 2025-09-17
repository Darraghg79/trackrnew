export interface GearItem {
  id: string
  name: string
  serialNumber?: string
  type: "main" | "reserve" | "aad" | "other"
  isActive: boolean
  requiresService: boolean
  nextServiceDate?: Date
  lastServiceDate?: Date
  previousJumps: number
  notes?: string
  createdDate: Date
  groupId?: string // Add group association
}

export interface GearGroup {
  id: string
  name: string
  description?: string
  itemIds: string[]
  isActive: boolean
  createdDate: Date
}

export interface GearServiceReminder {
  gearId: string
  gearName: string
  nextServiceDate: Date
  isOverdue: boolean
  daysUntilDue: number
}

// For jump logging - represents selectable gear options
export interface GearOption {
  id: string
  name: string
  type: "group" | "item"
  itemIds: string[] // For groups: all item IDs, For items: just the item ID
}
