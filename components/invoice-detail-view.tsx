import React from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

/**
 * InvoiceDetailView Component
 * 
 * Displays detailed invoice information and manages invoice status workflow:
 * - Draft: Can be edited, locked, or deleted
 * - Locked: Ready to send, can be reopened or sent
 * - Sent: Final state, can only be downloaded or marked as paid
 */

// ============================================
// Type Definitions
// ============================================

interface InvoiceItem {
    jumpNumber: number
    date: string
    customerName: string
    service: string
    rate: number
    quantity?: number
    workJumpIds?: string[]
}

interface Invoice {
    id: string
    invoiceNumber: number
    dropZone: string
    status: 'draft' | 'locked' | 'sent' | 'paid'
    dateCreated: string
    dateLocked?: string
    dateSent?: string
    datePaid?: string
    items: InvoiceItem[]
    total: number
    notes?: string
}

interface InvoiceSettings {
    currency: string
    taxRate: number
    instructorInfo: {
        name: string
        address: string
        bankDetails: string
    }
}

interface InvoiceDetailViewProps {
    invoice: Invoice
    invoiceSettings: InvoiceSettings
    onBack: () => void
    onLock: () => void
    onSend: () => void
    onDownloadPDF: () => void
    onPreviewPDF: () => void
}

export function InvoiceDetailView({
    invoice,
    invoiceSettings,
    onBack,
    onLock,
    onSend,
    onDownloadPDF,
    onPreviewPDF
}: InvoiceDetailViewProps) {

    // ============================================
    // Utility Functions
    // ============================================

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB')
    }

    const formatCurrency = (amount: number) => {
        return `${invoiceSettings.currency}${amount.toFixed(2)}`
    }

    // ============================================
    // Calculations
    // ============================================

    const subtotal = invoice.total
    const tax = subtotal * (invoiceSettings.taxRate / 100)
    const totalWithTax = subtotal + tax

    /**
     * Group items by service type for cleaner display
     * This consolidates multiple instances of the same service
     */
    const groupedItems = invoice.items.reduce((acc, item) => {
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
    }, {} as Record<string, any>)

    // ============================================
    // Status Badge Styling
    // ============================================

    const getStatusBadgeClass = () => {
        switch (invoice.status) {
            case 'draft':
                return 'bg-yellow-100 text-yellow-800'
            case 'locked':
                return 'bg-blue-100 text-blue-800'
            case 'sent':
                return 'bg-green-100 text-green-800'
            case 'paid':
                return 'bg-emerald-100 text-emerald-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    // ============================================
    // Component Render
    // ============================================

    return (
        <div className="min-h-screen bg-gray-50 p-4 pb-24">
            <div className="max-w-4xl mx-auto">

                {/* Header Navigation */}
                <div className="flex items-center justify-between mb-6">
                    <Button
                        onClick={onBack}
                        variant="ghost"
                        className="text-blue-600 hover:text-blue-700"
                    >
                        ← Back to Invoices
                    </Button>
                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass()}`}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                    </div>
                </div>

                {/* Invoice Header Card */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex justify-between">
                            <div>
                                <CardTitle className="text-2xl">
                                    Invoice #{invoice.invoiceNumber}
                                </CardTitle>
                                <p className="text-gray-600 mt-2">{invoice.dropZone}</p>
                                {invoice.status === 'draft' && (
                                    <p className="text-sm text-orange-600 mt-1">
                                        ⚠️ Draft - Not yet finalized
                                    </p>
                                )}
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold text-blue-600">
                                    {formatCurrency(totalWithTax)}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Created: {formatDate(invoice.dateCreated)}
                                </p>
                                {invoice.dateLocked && (
                                    <p className="text-sm text-gray-500">
                                        Locked: {formatDate(invoice.dateLocked)}
                                    </p>
                                )}
                                {invoice.dateSent && (
                                    <p className="text-sm text-gray-500">
                                        Sent: {formatDate(invoice.dateSent)}
                                    </p>
                                )}
                                {invoice.datePaid && (
                                    <p className="text-sm text-gray-500">
                                        Paid: {formatDate(invoice.datePaid)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="font-medium text-gray-700 mb-1">Bill From:</p>
                                <p className="font-medium">{invoiceSettings.instructorInfo.name}</p>
                                <p className="text-gray-600">{invoiceSettings.instructorInfo.address}</p>
                            </div>
                            <div>
                                <p className="font-medium text-gray-700 mb-1">Payment Details:</p>
                                <div className="font-mono text-xs bg-gray-50 p-2 rounded mt-1 break-all">
                                    {invoiceSettings.instructorInfo.bankDetails}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Services Summary Card */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Services Summary</CardTitle>
                        <p className="text-sm text-gray-600">
                            {invoice.items.length} total service{invoice.items.length !== 1 ? 's' : ''}
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b text-gray-700">
                                        <th className="text-left py-2 font-medium">Service</th>
                                        <th className="text-center py-2 font-medium">Quantity</th>
                                        <th className="text-right py-2 font-medium">Rate</th>
                                        <th className="text-right py-2 font-medium">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.values(groupedItems).map((group: any) => (
                                        <tr key={group.service} className="border-b hover:bg-gray-50">
                                            <td className="py-3">{group.service}</td>
                                            <td className="text-center py-3">{group.count}</td>
                                            <td className="text-right py-3">
                                                {formatCurrency(group.rate)}
                                            </td>
                                            <td className="text-right py-3 font-medium">
                                                {formatCurrency(group.count * group.rate)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan={3} className="text-right py-2 font-medium">
                                            Subtotal:
                                        </td>
                                        <td className="text-right py-2 font-medium">
                                            {formatCurrency(subtotal)}
                                        </td>
                                    </tr>
                                    {invoiceSettings.taxRate > 0 && (
                                        <tr>
                                            <td colSpan={3} className="text-right py-2">
                                                Tax ({invoiceSettings.taxRate}%):
                                            </td>
                                            <td className="text-right py-2">
                                                {formatCurrency(tax)}
                                            </td>
                                        </tr>
                                    )}
                                    <tr className="border-t-2 font-bold">
                                        <td colSpan={3} className="text-right py-3 text-lg">
                                            Total Due:
                                        </td>
                                        <td className="text-right py-3 text-lg text-blue-600">
                                            {formatCurrency(totalWithTax)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Jump Details Card - For Audit Trail */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Jump Details</CardTitle>
                        <p className="text-sm text-gray-600">
                            Complete breakdown for accounting records
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {invoice.items.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">
                                    No items in this invoice
                                </p>
                            ) : (
                                invoice.items.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded text-sm hover:bg-gray-100"
                                    >
                                        <span className="font-medium">
                                            Jump #{item.jumpNumber}
                                        </span>
                                        <span className="text-gray-600">
                                            {formatDate(item.date)}
                                        </span>
                                        <span className="text-gray-700">
                                            {item.customerName}
                                        </span>
                                        <span className="text-blue-600 font-medium">
                                            {item.service}
                                        </span>
                                        <span className="font-medium">
                                            {formatCurrency(item.rate)}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Notes Card (if any) */}
                {invoice.notes && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Action Buttons - Fixed at Bottom */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg z-10">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex gap-3">

                            {/* Draft Status Actions */}
                            {invoice.status === 'draft' && (
                                <>
                                    <Button
                                        onClick={onPreviewPDF}
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        Preview PDF
                                    </Button>
                                    <Button
                                        onClick={onLock}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        Close & Lock Invoice
                                    </Button>
                                </>
                            )}

                            {/* Locked Status Actions */}
                            {invoice.status === 'locked' && (
                                <>
                                    <Button
                                        onClick={onLock}
                                        variant="outline"
                                        className="flex-1 text-orange-600 border-orange-300 hover:bg-orange-50"
                                    >
                                        Reopen Invoice
                                    </Button>
                                    <Button
                                        onClick={onDownloadPDF}
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        Download PDF
                                    </Button>
                                    <Button
                                        onClick={onSend}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        Send Invoice
                                    </Button>
                                </>
                            )}

                            {/* Sent Status Actions */}
                            {invoice.status === 'sent' && (
                                <>
                                    <Button
                                        onClick={onDownloadPDF}
                                        className="w-full bg-gray-600 hover:bg-gray-700 text-white"
                                    >
                                        Download PDF
                                    </Button>
                                </>
                            )}

                            {/* Paid Status Actions */}
                            {invoice.status === 'paid' && (
                                <Button
                                    onClick={onDownloadPDF}
                                    className="w-full bg-gray-600 hover:bg-gray-700 text-white"
                                >
                                    Download PDF
                                </Button>
                            )}

                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}

export default InvoiceDetailView