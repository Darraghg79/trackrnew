"use client"

import { useState } from 'react'
import { BottomNavigation } from './bottom-navigation'
import { JumpEntryForm } from './jump-entry-form'
import { SummaryTab } from './summary-tab'
import { SettingsTab } from './settings-tab'
import { WorkJumpsTab } from './work-jumps-tab'
import { JumpSigningFlow } from './jump-signing-flow'
import { Button } from './ui/button'
import type { Invoice, JumpRecord, JumpSignature } from './types'
import { DROPZONE_DATABASE, AIRCRAFT_DATABASE } from '@/lib/dropzone-data'
import InvoiceDetailView from './invoice-detail-view'

/**
 * MainTracker Component - FIXED VERSION WITH SIGNATURES
 * 
 * Fixes:
 * - Preserves invoice tracking fields when editing jumps
 * - Prevents duplicate invoicing of services
 * - Properly tracks which services have been invoiced
 * - Includes full signature functionality for jump certification
 */
export function MainTracker() {
  // ============================================
  // Navigation State
  // ============================================
  const [activeTab, setActiveTab] = useState('jumps')
  const [showForm, setShowForm] = useState(false)
  const [editingJump, setEditingJump] = useState<number | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [jumpFilter, setJumpFilter] = useState<'all' | 'work' | 'personal'>('all')

  // ============================================
  // Signature State
  // ============================================
  const [showSigningFlow, setShowSigningFlow] = useState(false)
  const [selectedJumpsForSigning, setSelectedJumpsForSigning] = useState<number[]>([])
  const [isSelectMode, setIsSelectMode] = useState(false)

  // ============================================
  // Jump Data State - Enhanced with proper invoice tracking
  // ============================================
  const [savedJumps, setSavedJumps] = useState<JumpRecord[]>([
    {
      id: 'jump-1',
      jumpNumber: 1,
      date: new Date().toISOString(),
      dropZone: "Irish Parachute Club",
      aircraft: "Cessna 206",
      jumpType: "AFF",
      workJump: true,
      customerName: "DG1",
      invoiceItems: ["Tandem"],
      invoicedServices: [], // Services that have been permanently invoiced
      pendingInvoiceServices: [], // Services in a draft invoice
      totalRate: 70,
      exitAltitude: 13000,
      deploymentAltitude: 3500,
      freefallTime: 47,
      gearUsed: [],
      notes: "",
      // Enhanced invoice tracking
      invoiceIds: [], // Array of all invoices this jump is part of
      invoiceStatus: 'unbilled'
    },
    {
      id: 'jump-2',
      jumpNumber: 2,
      date: new Date().toISOString(),
      dropZone: "Irish Parachute Club",
      aircraft: "Cessna 206",
      jumpType: "AFF",
      workJump: false,
      customerName: "",
      invoiceItems: [],
      invoicedServices: [],
      pendingInvoiceServices: [],
      totalRate: 0,
      exitAltitude: 13000,
      deploymentAltitude: 3500,
      freefallTime: 47,
      gearUsed: [],
      notes: "",
      invoiceIds: [],
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
    jumpCountAuditLog: [],
    instructorInfo: {
      name: "Your Name",
      address: "Your Address"
    }
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
  // Helper Functions
  // ============================================

  // Find the next available jump number (fills gaps from deletions)
  const getNextJumpNumber = () => {
    if (savedJumps.length === 0) {
      // If no jumps exist, use settings value + 1
      return appSettings.currentJumpNumber + 1
    }

    // Get all existing jump numbers and sort them
    const existingNumbers = savedJumps
      .map(j => j.jumpNumber)
      .sort((a, b) => a - b)

    const highestExisting = existingNumbers[existingNumbers.length - 1]

    // If settings indicates we should be at a higher number, use it
    // This handles the case where user manually sets a high number in settings
    if (appSettings.currentJumpNumber >= highestExisting) {
      return appSettings.currentJumpNumber + 1
    }

    // Only look for gaps if we're not jumping ahead via settings
    // Check for gaps in the sequence
    for (let i = 1; i <= highestExisting; i++) {
      if (!existingNumbers.includes(i)) {
        return i // Return the first gap found
      }
    }

    // No gaps found, return the next number after the highest
    return highestExisting + 1
  }

  // ============================================
  // FIXED: Jump Management Functions
  // ============================================

  /**
   * FIXED: Saves a new jump or updates an existing one
   * Now preserves invoice tracking fields and signature when editing
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
      // FIXED: Preserve invoice tracking fields AND signature when editing
      const existingJump = savedJumps[editingJump]

      // Preserve all invoice-related fields and signature that shouldn't be editable
      const preservedFields = {
        invoicedServices: existingJump.invoicedServices || [],
        pendingInvoiceServices: existingJump.pendingInvoiceServices || [],
        invoiceIds: existingJump.invoiceIds || [],
        invoiceStatus: existingJump.invoiceStatus || 'unbilled',
        invoiceId: existingJump.invoiceId, // Legacy single ID field
        signature: existingJump.signature // Preserve signature when editing
      }

      // Merge the new data with preserved fields
      const updatedJump = {
        ...completeJumpData,
        ...preservedFields
      }

      const updated = [...savedJumps]
      updated[editingJump] = updatedJump
      setSavedJumps(updated)

      console.log('Jump updated with preserved invoice and signature data:', updatedJump)
    } else {
      // New jump - initialize invoice tracking fields
      const newJump = {
        ...completeJumpData,
        invoicedServices: [],
        pendingInvoiceServices: [],
        invoiceIds: [],
        invoiceStatus: 'unbilled',
        invoiceId: null,
        signature: undefined // No signature on new jumps
      }
      setSavedJumps([...savedJumps, newJump])

      // Update settings if this jump number is higher than current setting
      if (newJump.jumpNumber > appSettings.currentJumpNumber) {
        setAppSettings(prev => ({
          ...prev,
          currentJumpNumber: newJump.jumpNumber
        }))
      }

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
      const updatedJumps = savedJumps.filter((_, i) => i !== index)
      setSavedJumps(updatedJumps)

      // Update settings when deleting jumps
      if (updatedJumps.length === 0) {
        // No jumps left, reset to 0
        setAppSettings(prev => ({
          ...prev,
          currentJumpNumber: 0
        }))
      } else {
        // Find the new highest jump number
        const newHighest = Math.max(...updatedJumps.map(j => j.jumpNumber || 0))
        // Only update if the deleted jump was affecting the highest number
        if (newHighest < appSettings.currentJumpNumber) {
          setAppSettings(prev => ({
            ...prev,
            currentJumpNumber: newHighest
          }))
        }
      }
    }
  }

  const handleDuplicateJump = (index: number) => {
    const jumpToDuplicate = savedJumps[index]
    const newJump = {
      ...jumpToDuplicate,
      id: `jump-${Date.now()}`,
      jumpNumber: getNextJumpNumber(),
      date: new Date().toISOString(),
      invoiceStatus: 'unbilled' as const,
      invoiceIds: [],
      invoicedServices: [],
      pendingInvoiceServices: [],
      signature: undefined
    }
    setSavedJumps([...savedJumps, newJump])

    if (newJump.jumpNumber > appSettings.currentJumpNumber) {
      setAppSettings(prev => ({
        ...prev,
        currentJumpNumber: newJump.jumpNumber
      }))
    }
  }

  // ============================================
  // Signature Management Functions
  // ============================================

  /**
   * Toggles jump selection for signing
   */
  const handleToggleJumpSelection = (jumpNumber: number) => {
    setSelectedJumpsForSigning(prev => {
      if (prev.includes(jumpNumber)) {
        return prev.filter(num => num !== jumpNumber)
      }
      return [...prev, jumpNumber]
    })
  }

  /**
   * Selects all jumps for signing
   */
  const handleSelectAllJumps = () => {
    if (selectedJumpsForSigning.length === savedJumps.length) {
      setSelectedJumpsForSigning([])
    } else {
      setSelectedJumpsForSigning(savedJumps.map(j => j.jumpNumber))
    }
  }

  /**
   * Handles signature completion - adds signature to selected jumps
   */
  const handleSignatureComplete = (signature: JumpSignature, jumpNumbers: number[]) => {
    const updatedJumps = savedJumps.map(jump => {
      if (jumpNumbers.includes(jump.jumpNumber)) {
        return {
          ...jump,
          signature: {
            ...signature,
            signedBy: appSettings.instructorInfo?.name || 'Instructor'
          }
        }
      }
      return jump
    })

    setSavedJumps(updatedJumps)
    setShowSigningFlow(false)
    setSelectedJumpsForSigning([])
    setIsSelectMode(false)

    alert(`Successfully signed ${jumpNumbers.length} jump(s)`)
  }

  /**
   * Initiates the signing flow for selected jumps
   */
  const handleStartSigning = () => {
    if (selectedJumpsForSigning.length === 0) {
      alert('Please select at least one jump to sign')
      return
    }
    setShowSigningFlow(true)
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

  // Get the next available jump number (fills gaps)
  const nextAvailableJumpNumber = getNextJumpNumber()

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
          currentJumpNumber={nextAvailableJumpNumber - 1}
          appSettings={appSettings}
        />
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </>
    )
  }

  // ============================================
  // Render Signature Flow
  // ============================================

  if (showSigningFlow) {
    return (
      <JumpSigningFlow
        jumps={savedJumps}
        selectedJumpNumbers={selectedJumpsForSigning}
        onComplete={handleSignatureComplete}
        onCancel={() => {
          setShowSigningFlow(false)
          setSelectedJumpsForSigning([])
          setIsSelectMode(false)
        }}
      />
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
          <div className="min-h-screen bg-gray-50">
            {/* Header with Title and Buttons */}
            <div className="bg-white px-4 pt-6 pb-4">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold">Jump Log</h1>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setIsSelectMode(!isSelectMode)
                      if (isSelectMode) {
                        setSelectedJumpsForSigning([])
                      }
                    }}
                    variant="outline"
                    className={`px-6 py-2 ${isSelectMode ? "bg-gray-100" : ""}`}
                  >
                    {isSelectMode ? "Cancel" : "Sign"}
                  </Button>
                  <Button
                    onClick={() => setShowForm(true)}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Search jumps..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-12 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
                <svg
                  className="absolute left-4 top-3.5 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-8 border-b border-gray-200">
                <button
                  onClick={() => setJumpFilter('all')}
                  className={`pb-3 font-medium transition-colors ${jumpFilter === 'all'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500'
                    }`}
                >
                  All
                </button>
                <button
                  onClick={() => setJumpFilter('work')}
                  className={`pb-3 font-medium transition-colors ${jumpFilter === 'work'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500'
                    }`}
                >
                  Work
                </button>
                <button
                  onClick={() => setJumpFilter('personal')}
                  className={`pb-3 font-medium transition-colors ${jumpFilter === 'personal'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500'
                    }`}
                >
                  Personal
                </button>
              </div>
            </div>

            {/* Selection Mode Actions */}
            {isSelectMode && (
              <div className="bg-white px-4 py-3 border-b border-gray-200">
                <div className="flex gap-2">
                  <Button
                    onClick={handleSelectAllJumps}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    {selectedJumpsForSigning.length === savedJumps.length ? "Deselect All" : "Select All"}
                  </Button>
                  <Button
                    onClick={handleStartSigning}
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    disabled={selectedJumpsForSigning.length === 0}
                  >
                    Sign Selected ({selectedJumpsForSigning.length})
                  </Button>
                </div>
              </div>
            )}

            {/* Jump Cards */}
            <div className="px-4 py-4">
              {(() => {
                // Helper function for date formatting
                const formatJumpDate = (date: string | Date) => {
                  const d = new Date(date)
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                  const day = d.getDate().toString().padStart(2, '0')
                  const month = months[d.getMonth()]
                  const year = d.getFullYear()
                  return `${day}-${month}-${year}`
                }

                // Filter jumps based on search query
                let filteredJumps = savedJumps.filter(jump => {
                  if (!searchQuery) return true

                  const searchLower = searchQuery.toLowerCase()

                  return (
                    jump.jumpNumber.toString().includes(searchLower) ||
                    jump.dropZone?.toLowerCase().includes(searchLower) ||
                    jump.aircraft?.toLowerCase().includes(searchLower) ||
                    jump.jumpType?.toLowerCase().includes(searchLower) ||
                    jump.customerName?.toLowerCase().includes(searchLower) ||
                    jump.notes?.toLowerCase().includes(searchLower) ||
                    jump.invoiceItems?.some(item => item.toLowerCase().includes(searchLower)) ||
                    jump.gearUsed?.some(gear => gear.toLowerCase().includes(searchLower)) ||
                    (jump.signature?.licenceNumber && jump.signature.licenceNumber.toLowerCase().includes(searchLower))
                  )
                })

                // Apply filter tabs
                if (jumpFilter === 'work') {
                  filteredJumps = filteredJumps.filter(jump => jump.workJump === true)
                } else if (jumpFilter === 'personal') {
                  filteredJumps = filteredJumps.filter(jump => jump.workJump === false)
                }

                // Sort jumps by jump number only (highest first)
                const sortedJumps = [...filteredJumps].sort((a, b) => {
                  return b.jumpNumber - a.jumpNumber
                })

                if (sortedJumps.length > 0) {
                  return (
                    <>
                      <div className="space-y-3">
                        {sortedJumps.map((jump) => {
                          const index = savedJumps.findIndex(j => j.id === jump.id)
                          return (
                            <div
                              key={jump.id}
                              className={`bg-white rounded-xl p-4 shadow-sm ${isSelectMode && selectedJumpsForSigning.includes(jump.jumpNumber)
                                  ? 'ring-2 ring-green-500'
                                  : ''
                                }`}
                              onClick={() => {
                                if (isSelectMode) {
                                  handleToggleJumpSelection(jump.jumpNumber)
                                }
                              }}
                              style={{ cursor: isSelectMode ? 'pointer' : 'default' }}
                            >
                              <div className="flex items-start">
                                {/* Jump Number */}
                                <div className="flex-shrink-0 mr-4">
                                  <div className="text-4xl font-bold">{jump.jumpNumber}</div>
                                  <div className="text-sm text-gray-500 mt-1">
                                    {formatJumpDate(jump.date)}
                                  </div>
                                </div>

                                {/* Jump Details */}
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="font-semibold text-lg">{jump.dropZone}</div>
                                      <div className="text-gray-600 text-sm">{jump.aircraft}</div>
                                    </div>
                                    {jump.signature && (
                                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded ml-2">
                                        ✓ Signed
                                      </span>
                                    )}
                                  </div>

                                  {/* Work Jump Badge */}
                                  {jump.workJump && (
                                    <div className="mt-3">
                                      <div className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-md text-sm font-medium">
                                        Work Jump: {jump.customerName}: {jump.invoiceItems?.join(', ')}
                                      </div>
                                    </div>
                                  )}

                                  {/* Jump Type */}
                                  <div className="mt-3">
                                    <div className="text-xs text-gray-500">Jump Type</div>
                                    <div className="font-semibold">{jump.jumpType}</div>
                                  </div>
                                </div>
                              </div>

                              {/* Action Icons */}
                              {!isSelectMode && (
                                <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-gray-100">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleEditJump(index)
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Edit"
                                  >
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDuplicateJump(index)
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Duplicate"
                                  >
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteJump(index)
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Delete"
                                  >
                                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              )}

                              {/* Selection Checkbox */}
                              {isSelectMode && (
                                <div className="flex justify-center mt-4 pt-3 border-t border-gray-100">
                                  <input
                                    type="checkbox"
                                    checked={selectedJumpsForSigning.includes(jump.jumpNumber)}
                                    onChange={() => handleToggleJumpSelection(jump.jumpNumber)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-5 h-5 text-green-600 rounded"
                                  />
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {/* Footer Statistics */}
                      <div className="text-center py-6 text-gray-600">
                        <p>Showing {sortedJumps.length} of {savedJumps.length} jumps</p>
                        <p className="text-sm mt-1">Next jump: #{nextAvailableJumpNumber}</p>
                      </div>
                    </>
                  )
                } else if (searchQuery || jumpFilter !== 'all') {
                  return (
                    <div className="text-center py-12 text-gray-500">
                      <p>No jumps found</p>
                      <p className="text-sm mt-2">Try adjusting your search or filters</p>
                    </div>
                  )
                } else {
                  return (
                    <div className="text-center py-12 text-gray-500">
                      <p>No jumps logged yet</p>
                      <p className="text-sm mt-2">Tap Add to log your first jump!</p>
                    </div>
                  )
                }
              })()}
            </div>
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
            dropZones={dropZones}
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