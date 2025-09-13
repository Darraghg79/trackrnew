export interface JumpSignature {
  licenceNumber: string
  signatureData: string // Base64 encoded signature image
  signedDate: Date
  signedBy?: string // Optional signer name for display
}

export interface FinalizedInvoiceItem {
  itemName: string
  invoiceId: string
}

export interface RateAtTimeOfJump {
  service: string
  rate: number
}

export interface JumpRecord {
  jumpNumber: number
  date: Date
  dropZone: string
  aircraft: string
  gearUsed: string[]
  workJump: boolean
  jumpType: string
  exitAltitude: number
  deploymentAltitude: number
  freefallTime: number
  cutaway: boolean
  landingDistance: number
  notes: string
  customerName?: string
  invoiceItems?: string[] // All billable services for this jump
  rateAtTimeOfJump?: RateAtTimeOfJump[] // Store rates when jump is saved
  openInvoiceId?: string | null // Track if jump's items are in an open invoice
  finalizedInvoiceItems?: FinalizedInvoiceItem[] // Items that have been finalized in closed/sent/paid invoices
  totalRate?: number
  invoiceStatus?: "unbilled" | "open" | "closed" | "sent" | "paid" // Updated to include 'closed'

  // Signature fields
  signature?: JumpSignature
  editedAfterSigning?: boolean // Track if edited after signing
  lastEditDate?: Date // Track when last edited
}
