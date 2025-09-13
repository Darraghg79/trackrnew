// ============================================
// FILE: types/invoice.ts - MERGED VERSION
// Preserves all existing functionality + adds mobile support
// ============================================

import type { JumpRecord } from "./jumpRecord" // Keep your existing import

// ============================================
// PRESERVED: Your existing interfaces
// ============================================

export interface InvoiceLineItem {
  description: string
  itemCode: string  // PRESERVED: Your itemCode field
  quantity: number
  rate: number
  total: number
  details?: string  // ADDED: Optional field for additional details in PDF
}

export interface InvoiceDetailItem {
  service: string
  customerName: string
  jumpDate: string
  jumpNumber: number
}

// ============================================
// MERGED: Invoice interface with all fields
// ============================================

export interface Invoice {
  id: string
  invoiceNumber: number
  dropZone: string
  dropZoneEmail?: string  // Important for email functionality
  dropZoneAddress?: string  // ADDED: For PDF generation
  dropZoneContact?: string  // ADDED: For PDF generation
  dateCreated: Date
  dateClosed?: Date  // PRESERVED: Your date when invoice was closed
  dateLocked?: Date  // ADDED: If you want to distinguish locked from closed
  dateSent?: Date
  datePaid?: Date
  dueDate: Date
  status: "open" | "closed" | "sent" | "paid" | "draft"  // ADDED: "draft" status if needed
  isRevised?: boolean
  workJumpIds: number[]  // PRESERVED: Your number[] type
  lineItems: InvoiceLineItem[]
  
  // ADDED: Alternative items format (for backward compatibility if needed)
  items?: InvoiceItem[]  // Optional, only if you need to support legacy format
  
  subtotal: number
  tax: number
  taxRate: number
  total: number
  currency: string
  
  // PRESERVED: Your embedded instructorInfo structure
  instructorInfo: {
    name: string
    address: string
    taxNumber?: string
    bankDetails: string
    email?: string  // ADDED: Optional email for instructor
    phone?: string  // ADDED: Optional phone for instructor
  }
  
  // PRESERVED: Your jumpDetails structure
  jumpDetails: Array<{
    jumpNumber: number
    customerName: string
    jumpDate: string
    services: string[]
  }>
  
  // ADDED: Optional fields for enhanced functionality
  notes?: string  // For invoice notes in PDF
  previousInvoiceId?: string  // If this is a revision
}

// ============================================
// PRESERVED: All your other interfaces
// ============================================

export interface DropZoneBillingDetails {
  address: string
  financeContact: string
  financeEmail: string
}

export interface InvoiceSettings {
  currency: string
  taxRate: number
  rates: Record<string, number>
  instructorInfo: {
    name: string
    address: string
    taxNumber?: string
    bankDetails: string
    email?: string  // ADDED: For email functionality
    phone?: string  // ADDED: For PDF contact info
  }
  dropZoneBilling: Record<string, DropZoneBillingDetails>
}

export interface WorkJumpGroup {
  dropZone: string
  workJumps: JumpRecord[]
  totalValue: number
  customerCount: number
  status: "ready" | "invoiced"
}

// ============================================
// ADDED: Legacy support interface (optional)
// Only include if you need backward compatibility
// ============================================

export interface InvoiceItem {
  workJumpIds: string[]  // Note: string[] vs your number[]
  jumpNumber: number
  date: string
  customerName: string
  service: string
  quantity: number
  rate: number
  total: number
}

// ============================================
// ADDED: Type guards for runtime checking
// ============================================

export function isInvoiceLineItem(item: any): item is InvoiceLineItem {
  return item && 
    typeof item.description === 'string' &&
    typeof item.itemCode === 'string' &&
    typeof item.quantity === 'number' &&
    typeof item.rate === 'number' &&
    typeof item.total === 'number';
}

export function hasDropZoneBilling(
  settings: InvoiceSettings,
  dropZone: string
): DropZoneBillingDetails | undefined {
  return settings.dropZoneBilling[dropZone];
}