"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Invoice } from "@/types/invoice"
import { Lock, Unlock, Send, Download, FileText, Check, Plane, Share2, Mail } from "lucide-react"
import { 
  getPlatformCapabilities, 
  isDevelopment,
  generateFilename 
} from "@/lib/platform-utils"
import { 
  generateInvoicePDF,
  downloadPDF,
  openPDFInNewTab 
} from "@/lib/pdf-service"
import { 
  previewPDF,
  savePDFToDevice,
  sendInvoice,
  sharePDF 
} from "@/lib/native-integration"

interface InvoiceDetailProps {
  invoice: Invoice
  invoiceSettings: {
    currency: string
    taxRate: number
    instructorInfo: {
      name: string
      address: string
      bankDetails?: string
      taxNumber?: string
      email?: string
      phone?: string
    }
  }
  onBack: () => void
  onCloseInvoice: (invoiceId: string) => void
  onSendClosedInvoice: (invoiceId: string) => void
  onReopenInvoice: (invoiceId: string) => void
  onMarkAsPaid: (invoiceId: string) => void
  onDeleteOpenInvoice?: (invoiceId: string) => void
}

export const InvoiceDetail: React.FC<InvoiceDetailProps> = ({
  invoice: initialInvoice,
  invoiceSettings,
  onBack,
  onCloseInvoice,
  onSendClosedInvoice,
  onReopenInvoice,
  onMarkAsPaid,
  onDeleteOpenInvoice,
}) => {
  // Local state to track invoice changes for immediate UI updates
  const [invoice, setInvoice] = useState<Invoice>(initialInvoice)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [platform, setPlatform] = useState(getPlatformCapabilities())

  // Update local state when prop changes
  useEffect(() => {
    setInvoice(initialInvoice)
  }, [initialInvoice])

  // Update platform capabilities on mount (for SSR compatibility)
  useEffect(() => {
    setPlatform(getPlatformCapabilities())
  }, [])

  const formatCurrency = (amount: number) => {
    return `${invoiceSettings.currency}${amount.toFixed(2)}`
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-GB")
  }

  const handleDeleteInvoice = () => {
    if (confirm("Are you sure you want to delete this open invoice? All jumps will be returned to unbilled status.")) {
      onDeleteOpenInvoice?.(invoice.id)
      onBack()
    }
  }

  const handleCloseInvoice = () => {
    if (
      confirm(
        `Lock Invoice #${invoice.invoiceNumber}? This will finalize all items. New jumps will require a new invoice.`,
      )
    ) {
      setInvoice((prev) => ({
        ...prev,
        status: "closed" as const,
        dateClosed: new Date(),
      }))
      onCloseInvoice(invoice.id)
    }
  }

  const handleReopenInvoice = () => {
    if (confirm("Reopen this invoice for editing? Items will be moved back to pending status.")) {
      setInvoice((prev) => ({
        ...prev,
        status: "open" as const,
        dateClosed: undefined,
        dateSent: undefined,
      }))
      onReopenInvoice(invoice.id)
    }
  }

  const handleMarkAsPaid = () => {
    setInvoice((prev) => ({
      ...prev,
      status: "paid" as const,
      datePaid: new Date(),
    }))
    onMarkAsPaid(invoice.id)
  }

  /**
   * Generate PDF for preview or download
   */
  const generatePDF = async () => {
    setIsGeneratingPDF(true)
    try {
      const pdf = await generateInvoicePDF(
        invoice,
        invoiceSettings.instructorInfo,
        invoiceSettings.currency
      )
      return pdf
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      alert('Failed to generate PDF. Please try again.')
      return null
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  /**
   * Handle PDF preview - works differently on web vs native
   */
  const handlePreviewPDF = async () => {
    const pdf = await generatePDF()
    if (!pdf) return

    if (platform.isNative) {
      // Native preview
      await previewPDF(pdf)
    } else {
      // Web preview in new tab
      openPDFInNewTab(pdf)
      
      if (isDevelopment()) {
        console.log('Preview opened in new tab. In mobile app, this will use native PDF viewer.')
      }
    }
  }

  /**
   * Handle PDF download/save
   */
  const handleDownloadPDF = async () => {
    const pdf = await generatePDF()
    if (!pdf) return

    if (platform.isNative) {
      await savePDFToDevice(pdf)
      alert(`Invoice saved to Documents folder: ${pdf.filename}`)
    } else {
      downloadPDF(pdf)
    }
  }

  /**
   * Handle share action - uses native share or web share API
   */
  const handleShareInvoice = async () => {
    const pdf = await generatePDF()
    if (!pdf) return

    const text = `Invoice #${invoice.invoiceNumber} for ${invoice.dropZone}`
    const subject = `Invoice #${invoice.invoiceNumber}`

    const shared = await sharePDF(pdf, text, subject)
    
    if (!shared && !platform.canShare) {
      alert('Share is not available on this device. The invoice has been downloaded instead.')
    }
  }

  /**
   * Handle send invoice with email
   */
  const handleSendInvoice = async () => {
    if (!confirm("Send this invoice to the drop zone? This will finalize all items.")) {
      return
    }

    setIsSending(true)
    
    try {
      // Generate the PDF
      const pdf = await generatePDF()
      if (!pdf) {
        setIsSending(false)
        return
      }

      // Get drop zone email (you might want to add this to your data model)
      const dropZoneEmail = invoice.dropZoneEmail || 'dropzone@example.com'
      
      // Send the invoice
      await sendInvoice(
        pdf,
        dropZoneEmail,
        invoice.dropZone,
        invoice.invoiceNumber
      )

      // Update invoice status
      setInvoice((prev) => ({
        ...prev,
        status: "sent" as const,
        dateSent: new Date(),
      }))
      
      onSendClosedInvoice(invoice.id)
      
      // Show appropriate message based on platform
      if (platform.canEmail) {
        alert('Email composer opened with invoice attached.')
      } else if (platform.canShare) {
        alert('Invoice shared successfully.')
      } else {
        alert(
          'Invoice downloaded. Please attach it to an email manually. ' +
          'A mailto link has been opened for your convenience.'
        )
      }
    } catch (error) {
      console.error('Failed to send invoice:', error)
      alert('Failed to send invoice. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  /**
   * Get action button label based on platform capabilities
   */
  const getSendButtonLabel = () => {
    if (isSending) return 'Processing...'
    if (platform.canEmail) return 'Send via Email'
    if (platform.canShare) return 'Share Invoice'
    return 'Download & Email'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="text-blue-600 hover:text-blue-800 font-medium">
            ← Back to Work Jumps
          </button>
          <div className="flex space-x-2">
            {platform.canShare && (
              <Button 
                onClick={handleShareInvoice} 
                variant="outline"
                disabled={isGeneratingPDF}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            )}
            <Button 
              onClick={handleDownloadPDF} 
              variant="outline"
              disabled={isGeneratingPDF}
            >
              <Download className="w-4 h-4 mr-2" />
              {platform.isNative ? 'Save' : 'Download'}
            </Button>
          </div>
        </div>

        {/* Invoice Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">Invoice #{invoice.invoiceNumber}</CardTitle>
                <p className="text-gray-600 mt-1">{invoice.dropZone}</p>
                {invoice.isRevised && (
                  <span className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded mt-2">
                    Revised
                  </span>
                )}
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded text-sm font-medium ${
                    invoice.status === "paid"
                      ? "bg-green-100 text-green-800"
                      : invoice.status === "sent"
                        ? "bg-blue-100 text-blue-800"
                        : invoice.status === "closed" || invoice.status === "locked"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {invoice.status === "paid" && <Check className="w-3 h-3" />}
                  {invoice.status === "sent" && <Plane className="w-3 h-3" />}
                  {(invoice.status === "closed" || invoice.status === "locked") && <Lock className="w-3 h-3" />}
                  {(invoice.status === "open" || invoice.status === "draft") && "Draft"}
                  {(invoice.status === "closed" || invoice.status === "locked") && "Locked"}
                  {invoice.status === "sent" && "Sent"}
                  {invoice.status === "paid" && "Paid"}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Invoice Details</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-gray-500">Created:</span> {formatDate(invoice.dateCreated)}
                  </p>
                  <p>
                    <span className="text-gray-500">Due Date:</span> {formatDate(invoice.dueDate || new Date(new Date(invoice.dateCreated).getTime() + 30 * 24 * 60 * 60 * 1000))}
                  </p>
                  {invoice.dateClosed && (
                    <p>
                      <span className="text-gray-500">Closed:</span> {formatDate(invoice.dateClosed)}
                    </p>
                  )}
                  {invoice.dateSent && (
                    <p>
                      <span className="text-gray-500">Sent:</span> {formatDate(invoice.dateSent)}
                    </p>
                  )}
                  {invoice.datePaid && (
                    <p>
                      <span className="text-gray-500">Paid:</span> {formatDate(invoice.datePaid)}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Instructor</h3>
                <div className="text-sm">
                  <p className="font-medium">{invoiceSettings.instructorInfo.name}</p>
                  <p className="text-gray-600 whitespace-pre-line">{invoiceSettings.instructorInfo.address}</p>
                  {invoiceSettings.instructorInfo.taxNumber && (
                    <p className="text-gray-600">Tax: {invoiceSettings.instructorInfo.taxNumber}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jump Details */}
        {invoice.jumpDetails && invoice.jumpDetails.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Jump Details ({invoice.jumpDetails.length} jumps)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invoice.jumpDetails.map((jump) => (
                  <div key={jump.jumpNumber} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">Jump #{jump.jumpNumber}</p>
                      <p className="text-sm text-gray-600">
                        {jump.customerName} • {jump.jumpDate}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{jump.services.join(", ")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Line Items */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(invoice.lineItems || invoice.items || []).map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div>
                    <p className="font-medium">{item.description || item.service}</p>
                    <p className="text-sm text-gray-600">
                      {item.quantity} × {formatCurrency(item.rate)}
                    </p>
                  </div>
                  <p className="font-medium">{formatCurrency(item.total)}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(invoice.subtotal || invoice.total)}</span>
                </div>
                {invoice.tax && invoice.tax > 0 && (
                  <div className="flex justify-between">
                    <span>Tax ({((invoice.taxRate || 0) * 100).toFixed(1)}%):</span>
                    <span>{formatCurrency(invoice.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                  <span>Total:</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform-specific info message */}
        {isDevelopment() && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-800">
                <strong>Development Mode:</strong> 
                {platform.isWeb ? (
                  " Email attachments and native features will work in the mobile app. Currently showing web fallbacks."
                ) : (
                  " Native features detected. Email and share functionality available."
                )}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {(invoice.status === "open" || invoice.status === "draft") && (
            <div className="flex flex-col space-y-2">
              <Button
                onClick={handleCloseInvoice}
                className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Close & Lock Invoice
              </Button>
              <div className="flex space-x-2">
                <Button
                  onClick={handlePreviewPDF}
                  variant="outline"
                  className="flex-1 flex items-center justify-center gap-2"
                  disabled={isGeneratingPDF}
                >
                  <FileText className="w-4 h-4" />
                  Preview PDF
                </Button>
                {onDeleteOpenInvoice && (
                  <Button
                    onClick={handleDeleteInvoice}
                    variant="outline"
                    className="flex-1 text-red-600 border-red-300 hover:bg-red-50 bg-transparent"
                  >
                    Delete Invoice
                  </Button>
                )}
              </div>
            </div>
          )}

          {(invoice.status === "closed" || invoice.status === "locked") && (
            <div className="flex flex-col space-y-2">
              <Button
                onClick={handleSendInvoice}
                className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                disabled={isSending}
              >
                <Mail className="w-4 h-4" />
                {getSendButtonLabel()}
              </Button>
              <div className="flex space-x-2">
                <Button
                  onClick={handlePreviewPDF}
                  variant="outline"
                  className="flex-1 flex items-center justify-center gap-2"
                  disabled={isGeneratingPDF}
                >
                  <FileText className="w-4 h-4" />
                  Preview PDF
                </Button>
                <Button
                  onClick={handleReopenInvoice}
                  variant="outline"
                  className="flex-1 text-orange-600 border-orange-300 hover:bg-orange-50 bg-transparent flex items-center justify-center gap-2"
                >
                  <Unlock className="w-4 h-4" />
                  Reopen Invoice
                </Button>
              </div>
            </div>
          )}

          {invoice.status === "sent" && (
            <div className="flex space-x-3">
              <Button
                onClick={handleReopenInvoice}
                variant="outline"
                className="flex-1 text-orange-600 border-orange-300 hover:bg-orange-50 bg-transparent flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                Reopen
              </Button>
              <Button
                onClick={handleMarkAsPaid}
                className="flex-1 bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Mark as Paid
              </Button>
            </div>
          )}

          {invoice.status === "paid" && (
            <div className="w-full text-center py-4">
              <div className="inline-flex items-center gap-2 text-green-600 font-medium text-lg">
                <Check className="w-5 h-5" />
                Invoice Paid
              </div>
              <div className="mt-2 space-x-2">
                <Button
                  onClick={handlePreviewPDF}
                  variant="outline"
                  size="sm"
                  disabled={isGeneratingPDF}
                >
                  View PDF
                </Button>
                <Button
                  onClick={handleDownloadPDF}
                  variant="outline"
                  size="sm"
                  disabled={isGeneratingPDF}
                >
                  Download
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}