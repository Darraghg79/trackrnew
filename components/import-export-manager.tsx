"use client"

import type React from 'react'
import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    Upload,
    Download,
    FileText,
    AlertCircle,
    CheckCircle,
    FileSpreadsheet,
    AlertTriangle
} from 'lucide-react'
import type { JumpRecord } from '@/types/jump-record'
import type { Invoice } from '@/types/invoice'
import {
    exportJumpsToCSV,
    parseCSVToJumps,
    generateCSVTemplate,
    downloadFile,
    generateFilename,
    type ImportResult
} from '@/lib/import-export-utils'

interface ImportExportManagerProps {
    jumps: JumpRecord[]
    invoices: Invoice[]
    onImportJumps: (jumps: JumpRecord[]) => void
    onBackupData: () => { jumps: JumpRecord[], invoices: Invoice[], settings: any }
    onRestoreData: (data: { jumps: JumpRecord[], invoices: Invoice[], settings: any }) => void
}

export const ImportExportManager: React.FC<ImportExportManagerProps> = ({
    jumps,
    invoices,
    onImportJumps,
    onBackupData,
    onRestoreData
}) => {
    const [importStatus, setImportStatus] = useState<'idle' | 'preview' | 'success' | 'error'>('idle')
    const [importResult, setImportResult] = useState<ImportResult | null>(null)
    const [previewJumps, setPreviewJumps] = useState<JumpRecord[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    /**
     * Export all jumps to CSV
     */
    const handleExportJumps = () => {
        const csv = exportJumpsToCSV(jumps, false) // Don't include invoice data
        const filename = generateFilename('jump-records', 'csv')
        downloadFile(csv, filename, 'text/csv')
    }

    /**
     * Export work jumps only
     */
    const handleExportWorkJumps = () => {
        const workJumps = jumps.filter(j => j.workJump)
        const csv = exportJumpsToCSV(workJumps, true) // Include invoice data for work jumps
        const filename = generateFilename('work-jumps', 'csv')
        downloadFile(csv, filename, 'text/csv')
    }

    /**
     * Download CSV template
     */
    const handleDownloadTemplate = () => {
        const template = generateCSVTemplate()
        downloadFile(template, 'jump-import-template.csv', 'text/csv')
    }

    /**
     * Handle file selection for import
     */
    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.name.endsWith('.csv')) {
            setImportStatus('error')
            setImportResult({
                jumps: [],
                errors: ['Please select a CSV file'],
                warnings: [],
                totalRows: 0,
                successCount: 0
            })
            return
        }

        // Read and parse file
        const reader = new FileReader()
        reader.onload = (e) => {
            const content = e.target?.result as string
            const result = parseCSVToJumps(content, jumps)

            setImportResult(result)
            setPreviewJumps(result.jumps)

            if (result.errors.length > 0) {
                setImportStatus('error')
            } else {
                setImportStatus('preview')
            }
        }

        reader.onerror = () => {
            setImportStatus('error')
            setImportResult({
                jumps: [],
                errors: ['Failed to read file'],
                warnings: [],
                totalRows: 0,
                successCount: 0
            })
        }

        reader.readAsText(file)
    }

    /**
     * Confirm and import jumps
     */
    const handleConfirmImport = () => {
        if (previewJumps.length > 0) {
            onImportJumps(previewJumps)
            setImportStatus('success')

            // Reset after 3 seconds
            setTimeout(() => {
                setImportStatus('idle')
                setImportResult(null)
                setPreviewJumps([])
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                }
            }, 3000)
        }
    }

    /**
     * Cancel import
     */
    const handleCancelImport = () => {
        setImportStatus('idle')
        setImportResult(null)
        setPreviewJumps([])
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    /**
     * Export full backup as JSON
     */
    const handleFullBackup = () => {
        const backupData = onBackupData()
        const json = JSON.stringify(backupData, null, 2)
        const filename = generateFilename('trackr-backup', 'json')
        downloadFile(json, filename, 'application/json')
    }

    /**
     * Restore from JSON backup
     */
    const handleRestoreBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string
                const data = JSON.parse(content)

                // Basic validation
                if (!data.jumps || !Array.isArray(data.jumps)) {
                    throw new Error('Invalid backup file format')
                }

                onRestoreData(data)
                setImportStatus('success')

                setTimeout(() => {
                    setImportStatus('idle')
                }, 3000)
            } catch (error) {
                setImportStatus('error')
                setImportResult({
                    jumps: [],
                    errors: ['Invalid backup file format'],
                    warnings: [],
                    totalRows: 0,
                    successCount: 0
                })
            }
        }

        reader.readAsText(file)
    }

    return (
        <div className="space-y-6">
            {/* Export Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Download className="w-5 h-5" />
                        Export Data
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Download your jump records and invoices for backup or analysis
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                            onClick={handleExportJumps}
                            variant="outline"
                            className="w-full justify-start"
                        >
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Export All Jumps ({jumps.length} records)
                        </Button>

                        <Button
                            onClick={handleExportWorkJumps}
                            variant="outline"
                            className="w-full justify-start"
                            disabled={jumps.filter(j => j.workJump).length === 0}
                        >
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Export Work Jumps ({jumps.filter(j => j.workJump).length} records)
                        </Button>

                        <Button
                            onClick={handleFullBackup}
                            variant="outline"
                            className="w-full justify-start"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Full Backup (JSON)
                        </Button>

                        <Button
                            onClick={handleDownloadTemplate}
                            variant="outline"
                            className="w-full justify-start"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Download Import Template
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Import Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        Import Data
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Import jump records from CSV or restore from backup
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Import Status Messages */}
                    {importStatus === 'error' && importResult && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                <div className="space-y-1">
                                    <p className="font-semibold">Import failed</p>
                                    {importResult.errors.map((error, i) => (
                                        <p key={i} className="text-sm">{error}</p>
                                    ))}
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    {importStatus === 'preview' && importResult && (
                        <Alert>
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            <AlertDescription>
                                <div className="space-y-2">
                                    <p className="font-semibold">Preview Import</p>
                                    <p className="text-sm">
                                        Found {importResult.successCount} valid jumps out of {importResult.totalRows} rows
                                    </p>
                                    {importResult.warnings.length > 0 && (
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">Warnings:</p>
                                            {importResult.warnings.slice(0, 3).map((warning, i) => (
                                                <p key={i} className="text-xs">{warning}</p>
                                            ))}
                                            {importResult.warnings.length > 3 && (
                                                <p className="text-xs">...and {importResult.warnings.length - 3} more warnings</p>
                                            )}
                                        </div>
                                    )}
                                    <div className="flex gap-2 mt-4">
                                        <Button size="sm" onClick={handleConfirmImport}>
                                            Confirm Import
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={handleCancelImport}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    {importStatus === 'success' && (
                        <Alert>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription>
                                Successfully imported {previewJumps.length} jump records!
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* File Input Buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="csv-import"
                            />
                            <label htmlFor="csv-import">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start cursor-pointer"
                                    disabled={importStatus === 'preview'}
                                    onClick={() => document.getElementById('csv-import')?.click()}
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Import Jump Records (CSV)
                                </Button>
                            </label>
                        </div>

                        <div>
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleRestoreBackup}
                                className="hidden"
                                id="json-restore"
                            />
                            <label htmlFor="json-restore">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start cursor-pointer"
                                    onClick={() => document.getElementById('json-restore')?.click()}
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Restore from Backup (JSON)
                                </Button>
                            </label>
                        </div>
                    </div>

                    {/* Import Instructions */}
                    <div className="bg-muted p-4 rounded-lg space-y-2">
                        <p className="text-sm font-medium">Import Instructions:</p>
                        <ol className="text-xs space-y-1 list-decimal list-inside text-muted-foreground">
                            <li>Download the template CSV to see the correct format</li>
                            <li>Fill in your jump data (mandatory fields: jumpNumber, date, dropZone, aircraft)</li>
                            <li>For work jumps, set workJump=TRUE and include customerName and totalRate</li>
                            <li>Invoice items can be separated by semicolons (e.g., "Tandem;Video")</li>
                            <li>Imported jumps will NOT create invoices automatically</li>
                        </ol>
                    </div>
                </CardContent>
            </Card>

            {/* Preview Table (shown during import preview) */}
            {importStatus === 'preview' && previewJumps.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Import Preview</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            First 5 jumps to be imported
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="border-b">
                                    <tr>
                                        <th className="text-left p-2">Jump #</th>
                                        <th className="text-left p-2">Date</th>
                                        <th className="text-left p-2">Drop Zone</th>
                                        <th className="text-left p-2">Type</th>
                                        <th className="text-left p-2">Work Jump</th>
                                        <th className="text-left p-2">Customer</th>
                                        <th className="text-left p-2">Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewJumps.slice(0, 5).map((jump, i) => (
                                        <tr key={i} className="border-b">
                                            <td className="p-2">{jump.jumpNumber}</td>
                                            <td className="p-2">{new Date(jump.date).toLocaleDateString()}</td>
                                            <td className="p-2">{jump.dropZone}</td>
                                            <td className="p-2">{jump.jumpType}</td>
                                            <td className="p-2">{jump.workJump ? 'Yes' : 'No'}</td>
                                            <td className="p-2">{jump.customerName || '-'}</td>
                                            <td className="p-2">{jump.totalRate ? `€${jump.totalRate}` : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {previewJumps.length > 5 && (
                                <p className="text-sm text-muted-foreground mt-2">
                                    ...and {previewJumps.length - 5} more jumps
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}