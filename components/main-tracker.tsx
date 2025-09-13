"use client"

import { useState } from 'react'
import { BottomNavigation } from './bottom-navigation'
import { JumpEntryForm } from './jump-entry-form'
import { SummaryTab } from './summary-tab'
import { SettingsTab } from './settings-tab'
import { WorkJumpsTab } from './work-jumps-tab'
import { Button } from './ui/button'
import type { Invoice, JumpRecord } from './types'
import { DROPZONE_DATABASE, AIRCRAFT_DATABASE } from '@/lib/dropzone-data'
import InvoiceDetailView from './invoice-detail-view'

/**
 * MainTracker Component - FIXED VERSION
 * 
 * Fixes:
 * - Preserves invoice tracking fields when editing jumps
 * - Prevents duplicate invoicing of services
 * - Properly tracks which services have been invoiced
 */
export function MainTracker() {
  // ============================================
  // Navigation State
  // ============================================
  const [activeTab, setActiveTab] = useState('jumps')
  const [showForm, setShowForm] = useState(false)
  const [editingJump, setEditingJump] = useState<number | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  // ============================================
  // Jump Data State - Enhanced with proper invoice tracking
  // ============================================
  const [savedJumps, setSavedJumps] = useState<JumpRecord[]>([
    {
      id: 'jump-1',
      jumpNumber: 1,
      date: new Date().toISOString(),
      dropZone: "Irish Parachute Club",
      aircraft: "PAC 750XL",
      jumpType: "Tandem",
      workJump: true,
      customerName: "Test Customer",
      invoiceItems: ["Tandem", "Handcam"],
      invoicedServices: [], // Services that have been permanently invoiced
      pendingInvoiceServices: [], // Services in a draft invoice
      totalRate: 70,
      exitAltitude: 13000,
      deploymentAltitude: 3500,
      freefallTime: 47,
      gearUsed: [],
      notes: "Test work jump",
      // Enhanced invoice tracking
      invoiceIds: [], // Array of all invoices this jump is part of
      invoiceStatus: 'unbilled'
    }
  ])

  // ============================================
  // Invoice State
  // ============================================
  const [invoices, setInvoices] = useState<Invoice[]>([])

  // ============================================
  // Configuration State (unchanged)
  // ============================================
  const [dropZones, setDropZones] = useState(DROPZONE_DATABASE)
  const [aircraftOptions, setAircraftOptions] = useState(AIRCRAFT_DATABASE)
  const [jumpTypeOptions, setJumpTypeOptions] = useState([
    "Tandem", "AFF", "Formation", "Freefly", "Angle/Tracking", "Hop & Pop"
  ])

  const [gearOptions, setGearOptions] = useState([
    { id: "1", name: "Main Rig 1", type: "complete" },
    { id: "2", name: "Student Gear", type: "complete" },
    { id: "3", name: "Rental Gear", type: "complete" }
  ])

  const [gearItems, setGearItems] = useState([])
  const [gearGroups, setGearGroups] = useState([])

  // ============================================
  // App Settings (unchanged)
  // ============================================
  const [appSettings, setAppSettings] = useState({
    units: "feet",
    dateFormat: "MM/DD/YYYY",
    theme: "light",
    currentJumpNumber: savedJumps.length > 0
      ? Math.max(...savedJumps.map(j => j.jumpNumber || 0))
      : 1,
    currentFreefallTime: 0,
    freefallTimeAuditLog: [],
    jumpCountAuditLog: []
  })

  // ============================================
  // Invoice Settings (unchanged)
  // ============================================
  const [invoiceSettings, setInvoiceSettings] = useState({
    rates: {
      "Tandem": 30,
      "AFF": 40,
      "Handcam": 40,
      "Outside Camera": 40
    },
    currency: "€",
    taxRate: 0,
    instructorInfo: {
      name: "Your Name",
      address: "Your Address",
      bankDetails: "Your Bank Details"
    },
    dropZoneBilling: {}
  })

  // ============================================
  // FIXED: Jump Management Functions
  // ============================================

  /**
   * FIXED: Saves a new jump or updates an existing one
   * Now preserves invoice tracking fields when editing
   */
  const handleSaveJump = (jumpData: any) => {
    console.log('Saving jump:', jumpData)

    const completeJumpData = {
      ...jumpData,
      id: jumpData.id || `jump-${Date.now()}`,
      gearUsed: jumpData.gearUsed || [],
      invoiceItems: jumpData.invoiceItems || [],
      customerName: jumpData.customerName || "",
    }

    if (editingJump !== null) {
      // FIXED: Preserve invoice tracking fields when editing
      const existingJump = savedJumps[editingJump]
      
      // Preserve all invoice-related fields that shouldn't be editable
      const preservedFields = {
        invoicedServices: existingJump.invoicedServices || [],
        pendingInvoiceServices: existingJump.pendingInvoiceServices || [],
        invoiceIds: existingJump.invoiceIds || [],
        invoiceStatus: existingJump.invoiceStatus || 'unbilled',
        invoiceId: existingJump.invoiceId // Legacy single ID field
      }
      
      // Merge the new data with preserved fields
      const updatedJump = {
        ...completeJumpData,
        ...preservedFields
      }
      
      const updated = [...savedJumps]
      updated[editingJump] = updatedJump
      setSavedJumps(updated)
      
      console.log('Jump updated with preserved invoice data:', updatedJump)
    } else {
      // New jump - initialize invoice tracking fields
      const newJump = {
        ...completeJumpData,
        invoicedServices: [],
        pendingInvoiceServices: [],
        invoiceIds: [],
        invoiceStatus: 'unbilled',
        invoiceId: null
      }
      setSavedJumps([...savedJumps, newJump])
      console.log('New jump saved:', newJump)
    }
    
    setShowForm(false)
    setEditingJump(null)
  }

  const handleEditJump = (index: number) => {
    setEditingJump(index)
    setShowForm(true)
  }

  const handleDeleteJump = (index: number) => {
    if (confirm('Are you sure you want to delete this jump?')) {
      setSavedJumps(savedJumps.filter((_, i) => i !== index))
    }
  }

  // ============================================
  // FIXED: Invoice Management Functions
  // ============================================

  /**
   * FIXED: Creates a new invoice or adds jumps to existing draft invoice
   * Now properly excludes already-invoiced services
   */
  const handleCreateOrReviewInvoice = (workJumps: JumpRecord[], dropZone: string) => {
    console.log('Creating/reviewing invoice for', dropZone, 'with', workJumps.length, 'jumps')

    // Check for existing open invoice for this drop zone
    const existingDraftInvoice = invoices.find(
      inv => inv.dropZone === dropZone && inv.status === 'draft'
    )

    if (existingDraftInvoice) {
      alert(`There's already an open invoice for ${dropZone}. Please close it before creating a new one.`)
      setSelectedInvoice(existingDraftInvoice)
      setActiveTab('invoice-detail')
      return
    }

    // Create new invoice
    const invoiceNumber = invoices.length > 0
      ? Math.max(...invoices.map(inv => inv.invoiceNumber)) + 1
      : 1001

    // FIXED: Build invoice items - properly exclude already-invoiced services
    const invoiceItems = workJumps.flatMap(jump => {
      // Get services that have been permanently invoiced
      const invoicedServices = jump.invoicedServices || []
      
      // Get services currently in a draft invoice (shouldn't happen but check anyway)
      const pendingServices = jump.pendingInvoiceServices || []
      
      // Filter to only truly uninvoiced services
      const availableServices = (jump.invoiceItems || []).filter(
        service => !invoicedServices.includes(service) && !pendingServices.includes(service)
      )
      
      console.log(`Jump ${jump.jumpNumber}: Total services: ${jump.invoiceItems}, Already invoiced: ${invoicedServices}, Available: ${availableServices}`)
      
      // Create invoice items only for available services
      return availableServices.map(service => ({
        workJumpIds: [jump.id],
        jumpNumber: jump.jumpNumber,
        date: jump.date,
        customerName: jump.customerName,
        service: service,
        quantity: 1,
        rate: invoiceSettings.rates[service] || 0,
        total: invoiceSettings.rates[service] || 0
      }))
    })

    // Don't create invoice if no items to invoice
    if (invoiceItems.length === 0) {
      alert('No uninvoiced services available for these jumps.')
      return
    }

    // Calculate total
    const total = invoiceItems.reduce((sum, item) => sum + item.total, 0)

    // Create the invoice
    const newInvoice: Invoice = {
      id: `INV-${Date.now()}`,
      invoiceNumber,
      dropZone,
      status: 'draft',
      dateCreated: new Date().toISOString(),
      items: invoiceItems,
      total,
      notes: ''
    }

    // Add invoice to state
    setInvoices(prev => [...prev, newInvoice])

    // FIXED: Update jumps - track which services are in this draft invoice
    const updatedJumps = savedJumps.map(jump => {
      const isIncluded = workJumps.some(wj => wj.id === jump.id)
      if (isIncluded) {
        // Get services being invoiced for this jump
        const jumpInvoiceItems = invoiceItems
          .filter(item => item.workJumpIds.includes(jump.id))
          .map(item => item.service)
        
        // Add this invoice ID to the jump's invoice history
        const updatedInvoiceIds = [...(jump.invoiceIds || []), newInvoice.id]
        
        return {
          ...jump,
          invoiceId: newInvoice.id, // Legacy field
          invoiceIds: updatedInvoiceIds, // All invoices this jump is part of
          invoiceStatus: 'draft' as const,
          pendingInvoiceServices: jumpInvoiceItems // Services in current draft
        }
      }
      return jump
    })
    setSavedJumps(updatedJumps)

    // Navigate to the new invoice
    setSelectedInvoice(newInvoice)
    setActiveTab('invoice-detail')
  }

  /**
   * FIXED: Locks an invoice - permanently marks services as invoiced
   */
  const handleLockInvoice = (invoiceId: string) => {
    console.log('Locking invoice:', invoiceId)
    
    // Update invoice status
    const updatedInvoices = invoices.map(inv =>
      inv.id === invoiceId
        ? { ...inv, status: 'locked' as const, dateLocked: new Date().toISOString() }
        : inv
    )
    setInvoices(updatedInvoices)

    // FIXED: Update jumps - move pending services to permanently invoiced
    const updatedJumps = savedJumps.map(jump => {
      if (jump.invoiceIds?.includes(invoiceId) || jump.invoiceId === invoiceId) {
        // Add pending services to permanently invoiced services
        const newInvoicedServices = [
          ...(jump.invoicedServices || []),
          ...(jump.pendingInvoiceServices || [])
        ]
        
        console.log(`Jump ${jump.jumpNumber}: Moving services to invoiced:`, jump.pendingInvoiceServices)
        
        return {
          ...jump,
          invoiceStatus: 'locked' as const,
          invoicedServices: newInvoicedServices, // These services can never be invoiced again
          pendingInvoiceServices: [] // Clear pending
        }
      }
      return jump
    })
    setSavedJumps(updatedJumps)

    // Update selected invoice if viewing it
    if (selectedInvoice?.id === invoiceId) {
      setSelectedInvoice({ ...selectedInvoice, status: 'locked' as const })
    }
  }

  /**
   * FIXED: Sends an invoice - finalizes the invoiced services
   */
  const handleSendInvoice = (invoiceId: string) => {
    console.log('Sending invoice:', invoiceId)
    
    // Update invoice status
    const updatedInvoices = invoices.map(inv =>
      inv.id === invoiceId
        ? { ...inv, status: 'sent' as const, dateSent: new Date().toISOString() }
        : inv
    )
    setInvoices(updatedInvoices)

    // Update jump statuses (services remain in invoicedServices)
    const updatedJumps = savedJumps.map(jump => {
      if (jump.invoiceIds?.includes(invoiceId) || jump.invoiceId === invoiceId) {
        return { ...jump, invoiceStatus: 'sent' as const }
      }
      return jump
    })
    setSavedJumps(updatedJumps)

    // Update selected invoice if viewing it
    if (selectedInvoice?.id === invoiceId) {
      setSelectedInvoice({ ...selectedInvoice, status: 'sent' as const })
    }
  }

  /**
   * Marks an invoice as paid
   */
  const handleMarkAsPaid = (invoiceId: string) => {
    // Update invoice status
    const updatedInvoices = invoices.map(inv =>
      inv.id === invoiceId
        ? { ...inv, status: 'paid' as const, datePaid: new Date().toISOString() }
        : inv
    )
    setInvoices(updatedInvoices)

    // Update jump statuses
    const updatedJumps = savedJumps.map(jump => {
      if (jump.invoiceIds?.includes(invoiceId) || jump.invoiceId === invoiceId) {
        return { ...jump, invoiceStatus: 'paid' as const }
      }
      return jump
    })
    setSavedJumps(updatedJumps)

    alert('Invoice marked as paid!')
  }

  /**
   * FIXED: Reopens a locked or sent invoice
   * Moves services back to pending (not completely uninvoiced)
   */
  const handleReopenInvoice = (invoiceId: string) => {
    console.log('Reopening invoice:', invoiceId)
    
    const invoice = invoices.find(inv => inv.id === invoiceId)
    if (!invoice) return

    // Check if drop zone already has an open invoice
    const hasOtherOpenInvoice = invoices.some(
      inv => inv.dropZone === invoice.dropZone && 
             inv.status === 'draft' && 
             inv.id !== invoiceId
    )

    if (hasOtherOpenInvoice) {
      alert(`${invoice.dropZone} already has an open invoice. Close it first before reopening this one.`)
      return
    }

    // Reopen the invoice
    const updatedInvoices = invoices.map(inv =>
      inv.id === invoiceId
        ? { ...inv, status: 'draft' as const }
        : inv
    )
    setInvoices(updatedInvoices)

    // FIXED: Update jumps - move invoiced services back to pending
    const updatedJumps = savedJumps.map(jump => {
      if (jump.invoiceIds?.includes(invoiceId) || jump.invoiceId === invoiceId) {
        // Get services that were in this invoice
        const invoiceServices = invoice.items
          .filter(item => item.workJumpIds.includes(jump.id))
          .map(item => item.service)
        
        // Remove these services from permanently invoiced and add to pending
        const remainingInvoiced = (jump.invoicedServices || []).filter(
          service => !invoiceServices.includes(service)
        )
        
        console.log(`Jump ${jump.jumpNumber}: Moving services from invoiced back to pending:`, invoiceServices)
        
        return {
          ...jump,
          invoiceStatus: 'draft' as const,
          invoicedServices: remainingInvoiced,
          pendingInvoiceServices: invoiceServices
        }
      }
      return jump
    })
    setSavedJumps(updatedJumps)

    alert('Invoice reopened successfully!')
  }

  /**
   * FIXED: Deletes an open (draft) invoice
   * Returns services to completely uninvoiced state
   */
  const handleDeleteOpenInvoice = (invoiceId: string) => {
    console.log('Deleting invoice:', invoiceId)
    
    const invoice = invoices.find(inv => inv.id === invoiceId)
    if (!invoice || invoice.status !== 'draft') {
      alert('Only draft invoices can be deleted')
      return
    }

    if (!confirm('Are you sure you want to delete this invoice? The jumps will become unbilled again.')) {
      return
    }

    // Remove the invoice
    setInvoices(prev => prev.filter(inv => inv.id !== invoiceId))

    // FIXED: Reset jump statuses to unbilled
    const updatedJumps = savedJumps.map(jump => {
      if (jump.invoiceIds?.includes(invoiceId) || jump.invoiceId === invoiceId) {
        // Remove this invoice from the jump's invoice history
        const updatedInvoiceIds = (jump.invoiceIds || []).filter(id => id !== invoiceId)
        
        // Determine new status based on remaining invoices
        let newStatus: 'unbilled' | 'draft' | 'locked' | 'sent' | 'paid' = 'unbilled'
        if (updatedInvoiceIds.length > 0) {
          // Check status of other invoices this jump is part of
          const otherInvoices = invoices.filter(inv => 
            updatedInvoiceIds.includes(inv.id) && inv.id !== invoiceId
          )
          if (otherInvoices.some(inv => inv.status === 'paid')) newStatus = 'paid'
          else if (otherInvoices.some(inv => inv.status === 'sent')) newStatus = 'sent'
          else if (otherInvoices.some(inv => inv.status === 'locked')) newStatus = 'locked'
          else if (otherInvoices.some(inv => inv.status === 'draft')) newStatus = 'draft'
        }
        
        console.log(`Jump ${jump.jumpNumber}: Removing from invoice, clearing pending services`)
        
        return {
          ...jump,
          invoiceId: updatedInvoiceIds.length > 0 ? updatedInvoiceIds[updatedInvoiceIds.length - 1] : null,
          invoiceIds: updatedInvoiceIds,
          invoiceStatus: newStatus,
          pendingInvoiceServices: [] // Clear pending services
        }
      }
      return jump
    })
    setSavedJumps(updatedJumps)

    alert('Invoice deleted. Jumps are now unbilled.')
  }

  // ============================================
  // Settings Update Functions (unchanged)
  // ============================================

  const handleUpdateJumpsJumpType = (oldJumpType: string, newJumpType: string) => {
    const updated = savedJumps.map(jump => {
      if (jump.jumpType === oldJumpType) {
        return { ...jump, jumpType: newJumpType }
      }
      return jump
    })
    setSavedJumps(updated)
  }

  const handleUpdateJumpsAircraft = (oldAircraft: string, newAircraft: string) => {
    const updated = savedJumps.map(jump => {
      if (jump.aircraft === oldAircraft) {
        return { ...jump, aircraft: newAircraft }
      }
      return jump
    })
    setSavedJumps(updated)
  }

  // ============================================
  // Computed Values
  // ============================================

  const currentJumpNumber = savedJumps.length > 0
    ? Math.max(...savedJumps.map(j => j.jumpNumber || 0)) + 1
    : 1

  const lastJumpData = savedJumps.length > 0 
    ? savedJumps[savedJumps.length - 1] 
    : null

  // ============================================
  // Render Jump Entry Form
  // ============================================

  if (showForm && activeTab === 'jumps') {
    const initialData = editingJump !== null
      ? {
          ...savedJumps[editingJump],
          date: new Date(savedJumps[editingJump].date)
        }
      : null

    return (
      <>
        <JumpEntryForm
          onClose={() => {
            setShowForm(false)
            setEditingJump(null)
          }}
          onSave={handleSaveJump}
          initialData={initialData}
          existingJumps={savedJumps}
          lastJumpData={lastJumpData}
          dropZoneOptions={dropZones.map(dz => dz.name)}
          aircraftOptions={aircraftOptions}
          jumpTypeOptions={jumpTypeOptions}
          gearOptions={gearOptions}
          invoiceSettings={invoiceSettings}
          currentJumpNumber={currentJumpNumber}
          appSettings={appSettings}
        />
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </>
    )
  }

  // ============================================
  // Main Application Render
  // ============================================

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="container mx-auto max-w-4xl p-4">

        {/* Jumps Tab */}
        {activeTab === 'jumps' && (
          <div>
            <h1 className="text-3xl font-bold text-center py-8">TrackR</h1>
            <p className="text-center text-gray-600 mb-8">Jump, Track, Get Paid</p>

            <Button
              onClick={() => setShowForm(true)}
              className="w-full mb-6 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Add New Jump
            </Button>

            {savedJumps.length > 0 ? (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Total: {savedJumps.length} jumps
                  ({savedJumps.filter(j => j.workJump).length} work,
                  {savedJumps.filter(j => !j.workJump).length} fun)
                </p>
                <div className="space-y-3">
                  {savedJumps.map((jump, index) => (
                    <div key={jump.id} className="bg-white p-4 rounded-lg shadow-sm border">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">Jump #{jump.jumpNumber}</span>
                        <div className="space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditJump(index)}
                            className="text-blue-600"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteJump(index)}
                            className="text-red-600"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>{jump.dropZone} • {jump.jumpType}</p>
                        {jump.workJump ? (
                          <div>
                            <p className="text-blue-600 mt-1">
                              💼 Work Jump: {jump.customerName}
                            </p>
                            {jump.invoiceStatus && jump.invoiceStatus !== 'unbilled' && (
                              <p className={`text-xs mt-1 ${
                                jump.invoiceStatus === 'sent' ? 'text-green-600' :
                                jump.invoiceStatus === 'locked' ? 'text-orange-600' :
                                jump.invoiceStatus === 'draft' ? 'text-yellow-600' :
                                'text-gray-600'
                              }`}>
                                Invoice Status: {jump.invoiceStatus}
                              </p>
                            )}
                            {jump.invoiceItems && jump.invoiceItems.length > 0 && (
                              <div className="text-xs text-gray-500">
                                <p>Services: {jump.invoiceItems.join(', ')}</p>
                                {jump.invoicedServices && jump.invoicedServices.length > 0 && (
                                  <p className="text-green-600">
                                    Invoiced: {jump.invoicedServices.join(', ')}
                                  </p>
                                )}
                                {jump.pendingInvoiceServices && jump.pendingInvoiceServices.length > 0 && (
                                  <p className="text-yellow-600">
                                    Pending: {jump.pendingInvoiceServices.join(', ')}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-green-600 mt-1">🎉 Fun Jump</p>
                        )}
                        {jump.notes && (
                          <p className="text-gray-500 mt-1 italic">{jump.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No jumps logged yet</p>
                <p className="text-sm mt-2">Add your first jump to get started!</p>
              </div>
            )}
          </div>
        )}

        {/* Work Jumps Tab */}
        {activeTab === 'work' && (
          <WorkJumpsTab
            workJumps={savedJumps.filter(jump => jump.workJump === true)}
            invoices={invoices}
            invoiceSettings={invoiceSettings}
            dropZones={dropZones.map(dz => dz.name)}
            onUpdateInvoices={setInvoices}
            onUpdateJumps={setSavedJumps}
            onCreateOrReviewInvoice={handleCreateOrReviewInvoice}
            onViewInvoice={(invoice) => {
              setSelectedInvoice(invoice)
              setActiveTab('invoice-detail')
            }}
            onMarkAsPaid={handleMarkAsPaid}
            onReopenInvoice={handleReopenInvoice}
            onDeleteOpenInvoice={handleDeleteOpenInvoice}
          />
        )}

        {/* Invoice Detail View */}
        {activeTab === 'invoice-detail' && selectedInvoice && (
          <InvoiceDetailView
            invoice={selectedInvoice}
            invoiceSettings={invoiceSettings}
            onBack={() => {
              setActiveTab('work')
              setSelectedInvoice(null)
            }}
            onLock={() => {
              const newStatus = selectedInvoice.status === 'draft' ? 'locked' : 'draft'
              
              if (newStatus === 'locked') {
                handleLockInvoice(selectedInvoice.id)
              } else {
                handleReopenInvoice(selectedInvoice.id)
              }
            }}
            onSend={() => {
              handleSendInvoice(selectedInvoice.id)
              setActiveTab('work')
              setSelectedInvoice(null)
            }}
            onDownloadPDF={() => {
              console.log('Downloading PDF for invoice:', selectedInvoice.invoiceNumber)
            }}
            onPreviewPDF={() => {
              console.log('Previewing PDF for invoice:', selectedInvoice.invoiceNumber)
            }}
          />
        )}

        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <SummaryTab
            jumps={savedJumps}
            dropZones={dropZones}
            invoiceSettings={invoiceSettings}
            appSettings={appSettings}
          />
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <SettingsTab
            invoiceSettings={invoiceSettings}
            onUpdateSettings={setInvoiceSettings}
            dropZones={dropZones}
            onUpdateDropZones={setDropZones}
            appSettings={appSettings}
            onUpdateAppSettings={setAppSettings}
            gearItems={gearItems}
            onUpdateGearItems={setGearItems}
            gearGroups={gearGroups}
            onUpdateGearGroups={setGearGroups}
            gearOptions={gearOptions}
            onUpdateGearOptions={setGearOptions}
            savedJumps={savedJumps}
            aircraftOptions={aircraftOptions}
            jumpTypeOptions={jumpTypeOptions}
            onUpdateAircraftOptions={setAircraftOptions}
            onUpdateJumpTypeOptions={setJumpTypeOptions}
            onUpdateJumpsJumpType={handleUpdateJumpsJumpType}
            onUpdateJumpsAircraft={handleUpdateJumpsAircraft}
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}