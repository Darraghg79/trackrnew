"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { JumpRecord } from "@/types/jump-record"
import type { Invoice, InvoiceSettings, WorkJumpGroup } from "@/types/invoice"
import { Lock, Plane, Check } from "lucide-react"
import { InvoiceDetailView } from './invoice-detail-view'

/**
 * WorkJumpsTab Component
 * 
 * Manages the workflow for creating and managing invoices from work jumps.
 * Key features:
 * - Groups unbilled work jumps by drop zone
 * - Enforces one open invoice per drop zone
 * - Tracks invoice status through draft -> locked -> sent -> paid lifecycle
 * - Handles reopening of invoices with validation
 * - Tracks which services have been invoiced vs available
 */
interface WorkJumpsTabProps {
  workJumps: JumpRecord[]
  invoices: Invoice[]
  invoiceSettings: InvoiceSettings
  onCreateOrReviewInvoice: (workJumps: JumpRecord[], dropZone: string) => void
  onViewInvoice: (invoice: Invoice) => void
  onMarkAsPaid: (invoiceId: string) => void
  onReopenInvoice: (invoiceId: string) => void
  onDeleteOpenInvoice: (invoiceId: string) => void
  onUpdateInvoices: (updater: (prev: Invoice[]) => Invoice[]) => void
  onUpdateJumps: (updater: (prev: JumpRecord[]) => JumpRecord[]) => void
  dropZones: string[]
}

export const WorkJumpsTab: React.FC<WorkJumpsTabProps> = ({
  workJumps,
  invoices,
  invoiceSettings,
  onCreateOrReviewInvoice,
  onViewInvoice,
  onMarkAsPaid,
  onReopenInvoice,
  onDeleteOpenInvoice,
  onUpdateInvoices,
  onUpdateJumps,
  dropZones,
}) => {
  // ============================================
  // State Hooks - MUST be called before any conditional returns
  // ============================================
  const [activeTab, setActiveTab] = useState<"unbilled" | "invoices">("unbilled")
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showInvoiceDetail, setShowInvoiceDetail] = useState(false)

  // ============================================
  // Memoized Calculations - MUST be called before any conditional returns
  // ============================================

  /**
   * Groups unbilled work jumps by drop zone
   * Only includes services that haven't been invoiced yet
   */
  const unbilledGroups = useMemo(() => {
    // Filter for work jumps with uninvoiced services
    const unbilledJumps = workJumps.filter(jump => {
      // Skip non-work jumps
      if (!jump.workJump) return false

      // Get already invoiced services
      const invoicedServices = jump.invoicedServices || []
      const pendingServices = jump.pendingInvoiceServices || []

      // Get available (uninvoiced) services
      const availableServices = (jump.invoiceItems || []).filter(
        service => !invoicedServices.includes(service) && !pendingServices.includes(service)
      )

      // Only include if there are services to invoice
      return availableServices.length > 0
    })

    const groups: Record<string, WorkJumpGroup> = {}

    unbilledJumps.forEach(jump => {
      if (!groups[jump.dropZone]) {
        groups[jump.dropZone] = {
          dropZone: jump.dropZone,
          workJumps: [],
          totalValue: 0,
          customerCount: 0,
          status: "ready",
        }
      }

      groups[jump.dropZone].workJumps.push(jump)

      // Calculate value only for uninvoiced services
      const invoicedServices = jump.invoicedServices || []
      const pendingServices = jump.pendingInvoiceServices || []
      const availableServices = (jump.invoiceItems || []).filter(
        service => !invoicedServices.includes(service) && !pendingServices.includes(service)
      )

      const jumpValue = availableServices.reduce(
        (sum, item) => sum + (invoiceSettings.rates[item] || 0),
        0
      )
      groups[jump.dropZone].totalValue += jumpValue
    })

    // Calculate unique customers per group
    Object.values(groups).forEach(group => {
      const uniqueCustomers = new Set(group.workJumps.map(jump => jump.customerName).filter(Boolean))
      group.customerCount = uniqueCustomers.size
    })

    // Check for existing open invoices per drop zone
    Object.values(groups).forEach(group => {
      const hasOpenInvoice = invoices.some(
        inv => inv.dropZone === group.dropZone && inv.status === 'draft'
      )
      if (hasOpenInvoice) {
        group.status = 'has_open_invoice'
      }
    })

    return Object.values(groups)
  }, [workJumps, invoiceSettings.rates, invoices])

  const unbilledCount = unbilledGroups.length
  const invoiceCount = invoices.length

  // ============================================
  // Handler Functions
  // ============================================

  /**
   * Toggles invoice between draft and locked states
   * When locking: Moves services from pending to permanently invoiced
   * When unlocking: Moves services back to pending for editing
   */
    const handleLockInvoice = () => {
    if (!selectedInvoice) return

    // Determine if we're locking or unlocking
    const isLocking = selectedInvoice.status === 'draft'
    const newStatus = isLocking ? 'locked' : 'draft'

    const updatedInvoice = {
      ...selectedInvoice,
      status: newStatus as 'draft' | 'locked',
      dateLocked: isLocking ? new Date().toISOString() : undefined
    }

    // Update the invoice status
    onUpdateInvoices(prev =>
      prev.map(inv => inv.id === selectedInvoice.id ? updatedInvoice : inv)
    )

    // Update jumps based on lock/unlock action
    onUpdateJumps(prev =>
      prev.map(jump => {
        if (jump.invoiceId === selectedInvoice.id) {
          if (isLocking) {
            // When locking: move pending services to invoiced
            const newInvoicedServices = [
              ...(jump.invoicedServices || []),
              ...(jump.pendingInvoiceServices || [])
            ]

            return {
              ...jump,
              invoiceStatus: 'locked',
              invoicedServices: newInvoicedServices,
              pendingInvoiceServices: [] // Clear pending
            }
          } else {
            // When unlocking: move services back to pending
            const invoiceServices = selectedInvoice.items
              ?.filter((item: any) => item.workJumpIds?.includes(jump.id))
              .map((item: any) => item.service) || []

            // Remove these services from invoiced and add to pending
            const remainingInvoiced = (jump.invoicedServices || []).filter(
              service => !invoiceServices.includes(service)
            )

            return {
              ...jump,
              invoiceStatus: 'draft',
              invoicedServices: remainingInvoiced,
              pendingInvoiceServices: invoiceServices
            }
          }
        }
        return jump
      })
    )

    setSelectedInvoice(updatedInvoice)

    if (isLocking) {
      alert('Invoice locked successfully! You can now send it.')
    } else {
      alert('Invoice reopened for editing.')
    }
  }

  /**
   * Marks invoice as sent and opens email client
   */
  const handleSendInvoice = () => {
    if (!selectedInvoice) return

    const updatedInvoice = {
      ...selectedInvoice,
      status: 'sent' as const,
      dateSent: new Date().toISOString()
    }

    // Update the invoice
    onUpdateInvoices(prev =>
      prev.map(inv => inv.id === selectedInvoice.id ? updatedInvoice : inv)
    )

    // Update jump statuses
    onUpdateJumps(prev =>
      prev.map(jump => {
        if (jump.invoiceId === selectedInvoice.id) {
          return { ...jump, invoiceStatus: 'sent' }
        }
        return jump
      })
    )

    // Generate email with invoice details
    const subject = `Invoice #${selectedInvoice.invoiceNumber} - ${selectedInvoice.dropZone}`
    const body = [
      `Dear ${selectedInvoice.dropZone},`,
      '',
      `Please find attached invoice #${selectedInvoice.invoiceNumber} for skydiving instruction services.`,
      '',
      `Total Amount: ${invoiceSettings.currency}${selectedInvoice.total}`,
      '',
      'Payment Details:',
      invoiceSettings.instructorInfo.bankDetails,
      '',
      'Thank you for your business!',
      '',
      'Best regards,',
      invoiceSettings.instructorInfo.name
    ].join('\n')

    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

    alert('Invoice marked as sent. Email client opened.')
    setShowInvoiceDetail(false)
    setActiveTab('invoices')
  }

  /**
   * Preview PDF in new window
   */
  const handlePreviewPDF = () => {
    generateInvoicePDF(selectedInvoice, invoiceSettings, false)
  }

  /**
   * Download PDF (triggers print dialog)
   */
  const handleDownloadPDF = () => {
    generateInvoicePDF(selectedInvoice, invoiceSettings, true)
  }

  /**
   * Handle viewing an invoice - opens detail view
   * Sets the selected invoice and shows the detail view
   */
  const handleViewInvoice = (invoice: Invoice) => {
    console.log('Viewing invoice with status:', invoice.status) // Debug log
    setSelectedInvoice(invoice)
    setShowInvoiceDetail(true)
  }

  /**
   * Validates and reopens an invoice from sent/locked status
   * Ensures only one open invoice per drop zone
   */
  const handleReopenWithValidation = (invoice: Invoice) => {
    const hasOtherOpenInvoice = invoices.some(
      inv => inv.dropZone === invoice.dropZone &&
        inv.status === 'draft' &&
        inv.id !== invoice.id
    )

    if (hasOtherOpenInvoice) {
      alert(
        `${invoice.dropZone} already has an open invoice. ` +
        `Close it first before reopening this one.`
      )
      return
    }

    // Call the parent's reopen handler
    onReopenInvoice(invoice.id)

    // If we're viewing this invoice, update our local state
    if (selectedInvoice?.id === invoice.id) {
      setSelectedInvoice({ ...selectedInvoice, status: 'draft' })
    }
  }

  /**
   * Generates a professional PDF invoice
   */
  const generateInvoicePDF = (invoice: Invoice | null, settings: InvoiceSettings, download = false) => {
    if (!invoice) return

    const printWindow = window.open('', '_blank')

    if (!printWindow) {
      alert('Please allow pop-ups to preview/download the invoice')
      return
    }

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-GB')
    }

    const subtotal = invoice.total
    const tax = subtotal * (settings.taxRate / 100)
    const totalWithTax = subtotal + tax

    // Group items by service type
    const groupedItems = invoice.items?.reduce((acc: any, item: any) => {
      const service = item.service || 'Unknown Service'
      if (!acc[service]) {
        acc[service] = {
          service: service,
          rate: item.rate || 0,
          count: 0,
          details: []
        }
      }
      acc[service].count += (item.quantity || 1)
      acc[service].details.push({
        jumpNumber: item.jumpNumber,
        date: item.date,
        customerName: item.customerName
      })
      return acc
    }, {}) || {}

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            padding: 40px;
            background: white;
          }
          .invoice-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
          }
          .invoice-title {
            font-size: 32px;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 5px;
          }
          .invoice-number {
            font-size: 18px;
            color: #6b7280;
            font-weight: 500;
          }
          .invoice-status {
            background: ${invoice.status === 'draft' ? '#fef3c7' :
        invoice.status === 'locked' ? '#dbeafe' :
          invoice.status === 'sent' ? '#d1fae5' :
            '#e0e7ff'
      };
            color: ${invoice.status === 'draft' ? '#92400e' :
        invoice.status === 'locked' ? '#1e40af' :
          invoice.status === 'sent' ? '#065f46' :
            '#3730a3'
      };
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .info-section {
            margin-bottom: 30px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-top: 20px;
          }
          .info-block h3 {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            color: #6b7280;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
          }
          .info-block p {
            font-size: 14px;
            color: #1f2937;
            line-height: 1.5;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
          }
          th {
            background: #f9fafb;
            padding: 12px;
            text-align: left;
            font-size: 11px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #e5e7eb;
          }
          td {
            padding: 14px 12px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
          }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .total-section {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 14px;
          }
          .total-row.final {
            font-size: 20px;
            font-weight: 700;
            color: #1e40af;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #e5e7eb;
          }
          .details-section {
            margin-top: 40px;
            padding: 20px;
            background: #f9fafb;
            border-radius: 8px;
          }
          .details-title {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .detail-item {
            display: flex;
            justify-content: space-between;
            padding: 10px;
            margin-bottom: 6px;
            background: white;
            border-radius: 4px;
            font-size: 12px;
            border: 1px solid #e5e7eb;
          }
          .payment-info {
            background: #eff6ff;
            padding: 24px;
            border-radius: 8px;
            margin-top: 40px;
            border: 1px solid #bfdbfe;
          }
          .payment-info h3 {
            font-size: 14px;
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .payment-info p {
            font-size: 13px;
            color: #1f2937;
            line-height: 1.6;
          }
          .bank-details {
            font-family: 'Courier New', monospace;
            background: white;
            padding: 12px;
            border-radius: 4px;
            margin-top: 10px;
            border: 1px solid #dbeafe;
          }
          @media print {
            body { padding: 20px; }
            .no-print { display: none !important; }
          }
          .no-print {
            margin-top: 40px;
            text-align: center;
            padding: 20px;
            border-top: 1px solid #e5e7eb;
          }
          .btn {
            padding: 10px 24px;
            margin: 0 8px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.2s;
          }
          .btn-primary {
            background: #1e40af;
            color: white;
          }
          .btn-primary:hover {
            background: #1e3a8a;
          }
          .btn-secondary {
            background: #6b7280;
            color: white;
          }
          .btn-secondary:hover {
            background: #4b5563;
          }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <div>
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-number">#${invoice.invoiceNumber}</div>
            <div style="margin-top: 10px;">
              <strong style="font-size: 16px;">${invoice.dropZone}</strong><br>
              <span style="color: #6b7280; font-size: 13px;">Created: ${formatDate(invoice.dateCreated)}</span>
            </div>
          </div>
          <div style="text-align: right;">
            <span class="invoice-status">${invoice.status}</span>
            <div style="margin-top: 20px; font-size: 32px; font-weight: 700; color: #1e40af;">
              ${settings.currency}${totalWithTax.toFixed(2)}
            </div>
          </div>
        </div>

        <div class="info-section">
          <div class="info-grid">
            <div class="info-block">
              <h3>From</h3>
              <p>
                <strong>${settings.instructorInfo.name}</strong><br>
                ${settings.instructorInfo.address}
              </p>
            </div>
            <div class="info-block">
              <h3>Bill To</h3>
              <p>
                <strong>${invoice.dropZone}</strong><br>
                Drop Zone Services
              </p>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40%;">Service</th>
              <th class="text-center" style="width: 20%;">Quantity</th>
              <th class="text-right" style="width: 20%;">Rate</th>
              <th class="text-right" style="width: 20%;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${Object.values(groupedItems).map((item: any) => `
              <tr>
                <td><strong>${item.service}</strong></td>
                <td class="text-center">${item.count}</td>
                <td class="text-right">${settings.currency}${item.rate.toFixed(2)}</td>
                <td class="text-right" style="font-weight: 600;">${settings.currency}${(item.count * item.rate).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-row">
            <span>Subtotal</span>
            <span>${settings.currency}${subtotal.toFixed(2)}</span>
          </div>
          ${settings.taxRate > 0 ? `
            <div class="total-row">
              <span>Tax (${settings.taxRate}%)</span>
              <span>${settings.currency}${tax.toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="total-row final">
            <span>Total Due</span>
            <span>${settings.currency}${totalWithTax.toFixed(2)}</span>
          </div>
        </div>

        ${invoice.items && invoice.items.length > 0 ? `
          <div class="details-section">
            <div class="details-title">Jump Details</div>
            ${invoice.items.map((item: any) => `
              <div class="detail-item">
                <span><strong>Jump #${item.jumpNumber || 'N/A'}</strong></span>
                <span>${item.date ? formatDate(item.date) : ''}</span>
                <span>${item.customerName || ''}</span>
                <span style="color: #1e40af; font-weight: 600;">${item.service || ''}</span>
                <span style="font-weight: 600;">${settings.currency}${(item.rate || 0).toFixed(2)}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="payment-info">
          <h3>Payment Information</h3>
          <p>Please make payment to:</p>
          <div class="bank-details">
            ${settings.instructorInfo.bankDetails}
          </div>
        </div>

        <div class="no-print">
          <button onclick="window.print()" class="btn btn-primary">
            Print / Save as PDF
          </button>
          <button onclick="window.close()" class="btn btn-secondary">
            Close
          </button>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(invoiceHTML)
    printWindow.document.close()

    if (download) {
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }
  }


  /**
   * Creates invoice for a group of jumps
   * Enforces one open invoice per drop zone
   */
  const handleCreateOrReviewInvoice = (group: WorkJumpGroup) => {
    const openInvoice = invoices.find(
      inv => inv.dropZone === group.dropZone && inv.status === 'draft'
    )

    if (openInvoice) {
      alert(`There's already an open invoice for ${group.dropZone}. Please close it before creating a new one.`)
      handleViewInvoice(openInvoice)
      return
    }

    onCreateOrReviewInvoice(group.workJumps, group.dropZone)
  }


  // ============================================
  // Utility Functions
  // ============================================

  const formatCurrency = (amount: number) => {
    return `${invoiceSettings.currency}${amount.toFixed(2)}`
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-GB")
  }

  // ============================================
  // Conditional Returns - AFTER all hooks
  // ============================================

  if (showInvoiceDetail && selectedInvoice) {
    return (
      <InvoiceDetailView
        invoice={selectedInvoice}
        invoiceSettings={invoiceSettings}
        onBack={() => {
          setShowInvoiceDetail(false)
          setSelectedInvoice(null)
        }}
        onLock={handleLockInvoice}
        onSend={handleSendInvoice}
        onDownloadPDF={handleDownloadPDF}
        onPreviewPDF={handlePreviewPDF}
      />
    )
  }

  // ============================================
  // Tab Renderers
  // ============================================

  const renderUnbilledTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Unbilled Work Jumps</h2>
        <span className="text-sm text-gray-500">{unbilledGroups.length} drop zones</span>
      </div>

      {unbilledGroups.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">No unbilled work jumps</p>
            <p className="text-sm text-gray-400 mt-1">
              Work jumps will appear here when ready to invoice
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {unbilledGroups.map(group => {
            // Get uninvoiced services for display
            const getAvailableServices = (jump: JumpRecord) => {
              const invoicedServices = jump.invoicedServices || []
              const pendingServices = jump.pendingInvoiceServices || []
              return (jump.invoiceItems || []).filter(
                service => !invoicedServices.includes(service) && !pendingServices.includes(service)
              )
            }

            return (
              <Card key={group.dropZone} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{group.dropZone}</h3>
                      <p className="text-sm text-gray-600">
                        {group.customerCount} customer{group.customerCount !== 1 ? 's' : ''} • {group.workJumps.length} jump{group.workJumps.length !== 1 ? 's' : ''}
                        {group.status === 'has_open_invoice' && (
                          <span className="ml-2 text-orange-600 font-medium">
                            (Open invoice exists)
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(group.totalValue)}
                      </p>
                      <p className="text-sm text-gray-500">Total value</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {group.workJumps.slice(0, 3).map(jump => {
                      const availableServices = getAvailableServices(jump)
                      return (
                        <div key={jump.jumpNumber} className="flex justify-between items-center text-sm">
                          <span className="text-gray-700">
                            #{jump.jumpNumber} - {jump.customerName || 'No customer'}
                          </span>
                          <span className="text-gray-600">
                            {availableServices.join(", ")}
                          </span>
                        </div>
                      )
                    })}
                    {group.workJumps.length > 3 && (
                      <div className="text-sm text-gray-500 italic">
                        + {group.workJumps.length - 3} more jump{group.workJumps.length - 3 !== 1 ? 's' : ''}...
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => handleCreateOrReviewInvoice(group)}
                    className={`w-full font-medium py-3 ${group.status === 'has_open_invoice'
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'bg-green-600 hover:bg-green-700'
                      } text-white`}
                    disabled={group.status === 'has_open_invoice'}
                  >
                    {group.status === 'has_open_invoice'
                      ? 'Open Invoice Exists - Close it First'
                      : `Create Invoice (${group.workJumps.length} jump${group.workJumps.length !== 1 ? 's' : ''})`
                    }
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )

  const renderInvoicesTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Invoice History</h2>
        <span className="text-sm text-gray-500">
          {invoiceCount} total invoice{invoiceCount !== 1 ? 's' : ''}
        </span>
      </div>

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">No invoices created yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Create invoices from the Unbilled tab
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoices
            .sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime())
            .map(invoice => (
              <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Invoice #{invoice.invoiceNumber}
                      </h3>
                      <p className="text-sm text-gray-600">{invoice.dropZone}</p>
                      <p className="text-sm text-gray-500">
                        {invoice?.items?.length || 0} item{(invoice?.items?.length || 0) !== 1 ? 's' : ''} • {formatDate(invoice.dateCreated)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(invoice.total)}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${invoice.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : invoice.status === "sent"
                            ? "bg-blue-100 text-blue-800"
                            : invoice.status === "locked"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                      >
                        {invoice.status === "paid" && <Check className="w-3 h-3" />}
                        {invoice.status === "sent" && <Plane className="w-3 h-3" />}
                        {invoice.status === "locked" && <Lock className="w-3 h-3" />}
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleViewInvoice(invoice)}
                      variant="outline"
                      className="flex-1"
                    >
                      View Details
                    </Button>

                    {invoice.status === "draft" && (
                      <Button
                        onClick={() => handleViewInvoice(invoice)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Continue Editing
                      </Button>
                    )}

                    {invoice.status === "locked" && (
                      <Button
                        onClick={() => handleReopenWithValidation(invoice)}
                        variant="outline"
                        className="flex-1 text-orange-600 border-orange-300 hover:bg-orange-50"
                      >
                        Reopen
                      </Button>
                    )}

                    {invoice.status === "sent" && (
                      <>
                        <Button
                          onClick={() => handleReopenWithValidation(invoice)}
                          variant="outline"
                          className="flex-1 text-orange-600 border-orange-300 hover:bg-orange-50"
                        >
                          Reopen
                        </Button>
                        <Button
                          onClick={() => onMarkAsPaid(invoice.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          Mark as Paid
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  )

  // ============================================
  // Main Component Render
  // ============================================

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Work Jumps</h1>

        {/* Tab Navigation */}
        <div className="flex mb-6 bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setActiveTab("unbilled")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === "unbilled"
              ? "bg-blue-100 text-blue-700"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Unbilled ({unbilledCount})
          </button>
          <button
            onClick={() => setActiveTab("invoices")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === "invoices"
              ? "bg-blue-100 text-blue-700"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Invoices ({invoiceCount})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "unbilled" ? renderUnbilledTab() : renderInvoicesTab()}
      </div>
    </div>
  )
}