import type { JumpRecord } from '@/types/jump-record'

/**
 * CSV Import/Export Utilities for Jump Records
 * Production-ready with full validation and error handling
 */

// CSV Column Headers - Order matters for template generation
const CSV_HEADERS = [
    'jumpNumber',
    'date',
    'dropZone',
    'aircraft',
    'jumpType',
    'exitAltitude',
    'deploymentAltitude',
    'freefallTime',
    'gearUsed',
    'cutaway',
    'landingDistance',
    'notes',
    // Work jump specific fields
    'workJump',
    'customerName',
    'invoiceItems',
    'totalRate'
] as const

// Template data for CSV download
const TEMPLATE_JUMPS: Partial<JumpRecord>[] = [
    {
        jumpNumber: 1001,
        date: new Date('2025-01-15'),
        dropZone: 'Irish Parachute Club',
        aircraft: 'Cessna 206',
        jumpType: 'AFF',
        exitAltitude: 13000,
        deploymentAltitude: 3500,
        freefallTime: 47,
        gearUsed: ['Main: Sabre3 150', 'Reserve: PDR 143'],
        cutaway: false,
        landingDistance: 10,
        notes: 'Example jump - delete this row before importing',
        workJump: false
    },
    {
        jumpNumber: 1002,
        date: new Date('2025-01-15'),
        dropZone: 'Irish Parachute Club',
        aircraft: 'Cessna 208',
        jumpType: 'Tandem',
        exitAltitude: 13000,
        deploymentAltitude: 5000,
        freefallTime: 40,
        gearUsed: ['Tandem: Sigma 370'],
        cutaway: false,
        landingDistance: 25,
        notes: 'Example work jump with classification and rate',
        workJump: true,
        customerName: 'John Smith',
        invoiceItems: ['Tandem', 'Video'],
        totalRate: 250
    }
]

/**
 * Generate CSV Template for Import
 * Includes example data with all mandatory fields
 */
export function generateCSVTemplate(): string {
    const rows = [CSV_HEADERS.join(',')]

    TEMPLATE_JUMPS.forEach(jump => {
        const row = CSV_HEADERS.map(header => {
            const value = jump[header as keyof JumpRecord]

            if (value === null || value === undefined) return ''
            if (value instanceof Date) return value.toISOString().split('T')[0]
            if (Array.isArray(value)) return `"${value.join(';')}"`
            if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`
            }
            return String(value)
        })
        rows.push(row.join(','))
    })

    return rows.join('\n')
}

/**
 * Export Jump Records to CSV
 * @param jumps - Array of jump records to export
 * @param includeInvoiceData - Whether to include invoice-related fields
 */
export function exportJumpsToCSV(
    jumps: JumpRecord[],
    includeInvoiceData: boolean = false
): string {
    // Determine which headers to use
    const headers = includeInvoiceData
        ? [...CSV_HEADERS, 'invoiceStatus', 'openInvoiceId', 'finalizedInvoiceItems']
        : CSV_HEADERS

    const rows = [headers.join(',')]

    jumps.forEach(jump => {
        const row = headers.map(header => {
            const value = jump[header as keyof JumpRecord]

            if (value === null || value === undefined) return ''
            if (value instanceof Date) return value.toISOString().split('T')[0]
            if (Array.isArray(value)) {
                if (header === 'finalizedInvoiceItems') {
                    return `"${value.map((item: any) =>
                        `${item.itemName}:${item.invoiceId}`
                    ).join(';')}"`
                }
                return `"${value.join(';')}"`
            }
            if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`
            }
            return String(value)
        })
        rows.push(row.join(','))
    })

    return rows.join('\n')
}

/**
 * Validate imported jump data
 * Returns validation result with errors if any
 */
export interface ValidationResult {
    isValid: boolean
    errors: string[]
    warnings: string[]
}

function validateJumpRecord(
    jump: any,
    rowIndex: number,
    existingJumpNumbers: Set<number>
): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Mandatory field validation
    if (!jump.jumpNumber || isNaN(jump.jumpNumber)) {
        errors.push(`Row ${rowIndex}: Jump number is required and must be numeric`)
    } else if (existingJumpNumbers.has(jump.jumpNumber)) {
        errors.push(`Row ${rowIndex}: Jump number ${jump.jumpNumber} already exists`)
    }

    if (!jump.date) {
        errors.push(`Row ${rowIndex}: Date is required`)
    }

    if (!jump.dropZone) {
        errors.push(`Row ${rowIndex}: Drop zone is required`)
    }

    if (!jump.aircraft) {
        errors.push(`Row ${rowIndex}: Aircraft is required`)
    }

    // Altitude validation
    if (jump.exitAltitude && (jump.exitAltitude < 1000 || jump.exitAltitude > 30000)) {
        warnings.push(`Row ${rowIndex}: Unusual exit altitude ${jump.exitAltitude}`)
    }

    if (jump.deploymentAltitude && (jump.deploymentAltitude < 1000 || jump.deploymentAltitude > 10000)) {
        warnings.push(`Row ${rowIndex}: Unusual deployment altitude ${jump.deploymentAltitude}`)
    }

    // Work jump validation
    if (jump.workJump) {
        if (!jump.customerName) {
            errors.push(`Row ${rowIndex}: Customer name is required for work jumps`)
        }
        if (!jump.totalRate || jump.totalRate <= 0) {
            warnings.push(`Row ${rowIndex}: Work jump should have a positive rate`)
        }
    }

    return { isValid: errors.length === 0, errors, warnings }
}

/**
 * Parse CSV content and convert to Jump Records
 * @param csvContent - Raw CSV string
 * @param existingJumps - Existing jumps to check for duplicates
 * @returns Parsed jumps and validation results
 */
export interface ImportResult {
    jumps: JumpRecord[]
    errors: string[]
    warnings: string[]
    totalRows: number
    successCount: number
}

export function parseCSVToJumps(
    csvContent: string,
    existingJumps: JumpRecord[] = []
): ImportResult {
    const errors: string[] = []
    const warnings: string[] = []
    const jumps: JumpRecord[] = []

    // Get existing jump numbers for duplicate check
    const existingJumpNumbers = new Set(existingJumps.map(j => j.jumpNumber))

    // Parse CSV
    const lines = csvContent.trim().split(/\r?\n/)
    if (lines.length < 2) {
        errors.push('CSV file must contain headers and at least one data row')
        return { jumps: [], errors, warnings, totalRows: 0, successCount: 0 }
    }

    const headers = parseCSVLine(lines[0])
    const headerMap = new Map(headers.map((h, i) => [h.toLowerCase().trim(), i]))

    // Validate required headers
    const requiredHeaders = ['jumpnumber', 'date', 'dropzone', 'aircraft']
    for (const required of requiredHeaders) {
        if (!headerMap.has(required)) {
            errors.push(`Missing required column: ${required}`)
        }
    }

    if (errors.length > 0) {
        return { jumps: [], errors, warnings, totalRows: 0, successCount: 0 }
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue // Skip empty lines

        const values = parseCSVLine(lines[i])
        const jumpData: any = {}

        // Map values to jump record
        headers.forEach((header, index) => {
            const key = header.toLowerCase().trim()
            const value = values[index]?.trim() || ''

            switch (key) {
                case 'jumpnumber':
                    jumpData.jumpNumber = parseInt(value)
                    break
                case 'date':
                    jumpData.date = new Date(value)
                    break
                case 'dropzone':
                    jumpData.dropZone = value // Fixed: was looking for wrong field name
                    break
                case 'aircraft':
                    jumpData.aircraft = value
                    break
                case 'jumptype':
                    jumpData.jumpType = value
                    break
                case 'exitaltitude':
                    jumpData.exitAltitude = value ? parseFloat(value) : 13000
                    break
                case 'deploymentaltitude':
                    jumpData.deploymentAltitude = value ? parseFloat(value) : 3500
                    break
                case 'freefalltime':
                    jumpData.freefallTime = value ? parseFloat(value) : 0
                    break
                case 'landingdistance':
                    jumpData.landingDistance = value ? parseFloat(value) : 0
                    break
                case 'workjump':
                    jumpData.workJump = value.toUpperCase() === 'TRUE' || value === '1'
                    break
                case 'cutaway':
                    jumpData.cutaway = value.toUpperCase() === 'TRUE' || value === '1'
                    break
                case 'gearused':
                    jumpData.gearUsed = value ? value.split(';').map(s => s.trim()).filter(Boolean) : []
                    break
                case 'invoiceitems':
                    jumpData.invoiceItems = value ? value.split(';').map(s => s.trim()).filter(Boolean) : []
                    break
                case 'customername':
                    jumpData.customerName = value
                    break
                case 'totalrate':
                    jumpData.totalRate = value ? parseFloat(value) : 0
                    break
                case 'notes':
                    jumpData.notes = value
                    break
                default:
                    jumpData[key] = value
            }
        })

        // Validate jump record
        const validation = validateJumpRecord(jumpData, i + 1, existingJumpNumbers)
        errors.push(...validation.errors)
        warnings.push(...validation.warnings)

        if (validation.isValid) {
            // Create proper JumpRecord with defaults
            const jump: JumpRecord = {
                jumpNumber: jumpData.jumpNumber,
                date: jumpData.date,
                dropZone: jumpData.dropZone || '',
                aircraft: jumpData.aircraft || '',
                jumpType: jumpData.jumpType || '',
                exitAltitude: jumpData.exitAltitude || 13000,
                deploymentAltitude: jumpData.deploymentAltitude || 3500,
                freefallTime: jumpData.freefallTime || 0,
                gearUsed: jumpData.gearUsed || [],
                cutaway: jumpData.cutaway || false,
                landingDistance: jumpData.landingDistance || 0,
                notes: jumpData.notes || '',
                workJump: jumpData.workJump || false,
                customerName: jumpData.customerName || undefined,
                invoiceItems: jumpData.invoiceItems || undefined,
                totalRate: jumpData.totalRate || undefined,
                // FIXED: Mark imported work jumps as paid, not unbilled
                invoiceStatus: jumpData.workJump ? 'paid' : undefined,
                // Mark work jump services as already billed externally
                finalizedInvoiceItems: jumpData.workJump && jumpData.invoiceItems ?
                    jumpData.invoiceItems.map((item: string) => ({
                        itemName: item,
                        invoiceId: 'IMPORTED'
                    })) : undefined
            }

            jumps.push(jump)
            existingJumpNumbers.add(jump.jumpNumber)
        }
    }

    return {
        jumps,
        errors,
        warnings,
        totalRows: lines.length - 1,
        successCount: jumps.length
    }
}

/**
 * Parse a CSV line handling quoted values correctly
 */
function parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    let i = 0

    while (i < line.length) {
        const char = line[i]

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                // Escaped quote
                current += '"'
                i += 2
            } else {
                // Toggle quotes
                inQuotes = !inQuotes
                i++
            }
        } else if (char === ',' && !inQuotes) {
            // End of field
            result.push(current.trim())
            current = ''
            i++
        } else {
            current += char
            i++
        }
    }

    // Add the last field
    result.push(current.trim())

    return result
}

/**
 * Download helper function
 */
export function downloadFile(content: string, filename: string, type: string = 'text/csv') {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(prefix: string, extension: string): string {
    const date = new Date()
    const timestamp = date.toISOString().split('T')[0]
    return `${prefix}_${timestamp}.${extension}`
}