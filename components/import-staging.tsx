"use client"

import type React from 'react'
import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    AlertCircle,
    CheckCircle,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    Plus,
    X
} from 'lucide-react'
import type { JumpRecord } from '@/types/jump-record'

interface StagedJump extends Partial<JumpRecord> {
    _importRow: number
    _errors: string[]
    _warnings: string[]
    _isValid: boolean
    _dropZoneMatch?: {
        original: string
        matched?: string
        isNew?: boolean
        confidence?: number
    }
}

interface ImportStagingProps {
    stagedJumps: StagedJump[]
    existingDropZones: string[]
    existingAircraft: string[]
    existingJumpTypes: string[]
    existingJumpNumbers: number[]
    onConfirmImport: (jumps: JumpRecord[]) => void
    onCancel: () => void
    onAddDropZone?: (dropZone: string) => void
    onAddAircraft?: (aircraft: string) => void
    onAddJumpType?: (jumpType: string) => void
}

export const ImportStaging: React.FC<ImportStagingProps> = ({
    stagedJumps: initialJumps,
    existingDropZones,
    existingAircraft,
    existingJumpTypes,
    existingJumpNumbers,
    onConfirmImport,
    onCancel,
    onAddDropZone,
    onAddAircraft,
    onAddJumpType
}) => {
    const [stagedJumps, setStagedJumps] = useState<StagedJump[]>(initialJumps)
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
    const [dropZoneMapping, setDropZoneMapping] = useState<Record<string, string>>({})
    const [newDropZones, setNewDropZones] = useState<Set<string>>(new Set())

    // Fuzzy match function for dropzones
    const fuzzyMatchDropZone = (input: string, options: string[]): { match: string, confidence: number } | null => {
        if (!input) return null

        const inputLower = input.toLowerCase().trim()

        // Exact match
        const exactMatch = options.find(opt => opt.toLowerCase() === inputLower)
        if (exactMatch) return { match: exactMatch, confidence: 100 }

        // Contains match
        const containsMatch = options.find(opt =>
            opt.toLowerCase().includes(inputLower) || inputLower.includes(opt.toLowerCase())
        )
        if (containsMatch) return { match: containsMatch, confidence: 80 }

        // Partial word match
        const inputWords = inputLower.split(/\s+/)
        const partialMatch = options.find(opt => {
            const optWords = opt.toLowerCase().split(/\s+/)
            return inputWords.some(w => optWords.some(ow => ow.includes(w) || w.includes(ow)))
        })
        if (partialMatch) return { match: partialMatch, confidence: 60 }

        // Levenshtein distance for close matches
        const closeMatch = options
            .map(opt => ({
                option: opt,
                distance: levenshteinDistance(inputLower, opt.toLowerCase())
            }))
            .filter(item => item.distance < Math.min(5, input.length / 2))
            .sort((a, b) => a.distance - b.distance)[0]

        if (closeMatch) {
            const confidence = Math.max(40, 100 - (closeMatch.distance * 20))
            return { match: closeMatch.option, confidence }
        }

        return null
    }

    // Levenshtein distance algorithm
    const levenshteinDistance = (s1: string, s2: string): number => {
        const len1 = s1.length
        const len2 = s2.length
        const matrix: number[][] = []

        for (let i = 0; i <= len1; i++) {
            matrix[i] = [i]
        }
        for (let j = 0; j <= len2; j++) {
            matrix[0][j] = j
        }

        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                const cost = s1[i - 1] === s2[j - 1] ? 0 : 1
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                )
            }
        }

        return matrix[len1][len2]
    }

    // Process jumps with validation and fuzzy matching
    const processedJumps = useMemo(() => {
        return stagedJumps.map(jump => {
            const errors: string[] = []
            const warnings: string[] = []

            // Required field validation
            if (!jump.jumpNumber || isNaN(jump.jumpNumber)) {
                errors.push('Jump number is required and must be numeric')
            } else if (existingJumpNumbers.includes(jump.jumpNumber)) {
                errors.push(`Jump number ${jump.jumpNumber} already exists`)
            }

            if (!jump.date) {
                errors.push('Date is required')
            }

            if (!jump.dropZone) {
                errors.push('Drop zone is required')
            }

            if (!jump.aircraft) {
                errors.push('Aircraft is required')
            }

            // REMOVED: Customer name validation for work jumps
            // Historical imports don't need customer names

            // Work jump rate warning (not error)
            if (jump.workJump && (!jump.totalRate || jump.totalRate <= 0)) {
                warnings.push('Work jump has no rate specified')
            }

            // Altitude warnings
            if (jump.exitAltitude && (jump.exitAltitude < 1000 || jump.exitAltitude > 30000)) {
                warnings.push(`Unusual exit altitude: ${jump.exitAltitude}`)
            }

            if (jump.deploymentAltitude && (jump.deploymentAltitude < 1000 || jump.deploymentAltitude > 10000)) {
                warnings.push(`Unusual deployment altitude: ${jump.deploymentAltitude}`)
            }

            // Fuzzy match drop zone
            let dropZoneMatch = undefined
            if (jump.dropZone) {
                const mappedDZ = dropZoneMapping[jump.dropZone]
                if (mappedDZ) {
                    dropZoneMatch = {
                        original: jump.dropZone,
                        matched: mappedDZ,
                        isNew: newDropZones.has(mappedDZ),
                        confidence: 100
                    }
                } else {
                    const fuzzyMatch = fuzzyMatchDropZone(jump.dropZone, existingDropZones)
                    if (fuzzyMatch) {
                        dropZoneMatch = {
                            original: jump.dropZone,
                            matched: fuzzyMatch.match,
                            confidence: fuzzyMatch.confidence
                        }
                    } else {
                        dropZoneMatch = {
                            original: jump.dropZone,
                            isNew: true
                        }
                    }
                }
            }

            return {
                ...jump,
                _errors: errors,
                _warnings: warnings,
                _isValid: errors.length === 0,
                _dropZoneMatch: dropZoneMatch
            }
        })
    }, [stagedJumps, dropZoneMapping, newDropZones, existingJumpNumbers, existingDropZones])

    // Update a field for a specific jump
    const updateJumpField = (index: number, field: keyof JumpRecord, value: any) => {
        setStagedJumps(prev => {
            const updated = [...prev]
            updated[index] = { ...updated[index], [field]: value }
            return updated
        })
    }

    // Map a dropzone
    const mapDropZone = (original: string, mapped: string, isNew: boolean = false) => {
        setDropZoneMapping(prev => ({ ...prev, [original]: mapped }))
        if (isNew) {
            setNewDropZones(prev => new Set([...prev, mapped]))
        }

        // Update all jumps with this dropzone
        setStagedJumps(prev => prev.map(jump =>
            jump.dropZone === original ? { ...jump, dropZone: mapped } : jump
        ))
    }

    // Toggle row expansion
    const toggleRow = (index: number) => {
        setExpandedRows(prev => {
            const next = new Set(prev)
            if (next.has(index)) {
                next.delete(index)
            } else {
                next.add(index)
            }
            return next
        })
    }

    // Get summary statistics
    const stats = useMemo(() => {
        const valid = processedJumps.filter(j => j._isValid).length
        const errors = processedJumps.filter(j => !j._isValid).length
        const warnings = processedJumps.reduce((sum, j) => sum + j._warnings.length, 0)
        const workJumps = processedJumps.filter(j => j.workJump).length
        const newDZs = new Set(processedJumps.filter(j => j._dropZoneMatch?.isNew).map(j => j.dropZone))

        return { valid, errors, warnings, workJumps, newDropZones: newDZs.size }
    }, [processedJumps])

    // Handle import confirmation
    const handleConfirmImport = () => {
        const validJumps = processedJumps
            .filter(j => j._isValid)
            .map(({ _errors, _warnings, _isValid, _dropZoneMatch, _importRow, ...jump }) => {
                // Clean up internal fields and return valid JumpRecord
                return jump as JumpRecord
            })

        // Add new dropzones if handler provided
        if (onAddDropZone) {
            newDropZones.forEach(dz => onAddDropZone(dz))
        }

        onConfirmImport(validJumps)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Import Preview & Mapping</h2>
                <Button variant="outline" onClick={onCancel} size="sm">
                    <X className="w-4 h-4 mr-1" />
                    Cancel Import
                </Button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Total</div>
                    <div className="text-2xl font-bold">{processedJumps.length}</div>
                </Card>
                <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Valid</div>
                    <div className="text-2xl font-bold text-green-600">{stats.valid}</div>
                </Card>
                <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Errors</div>
                    <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
                </Card>
                <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Warnings</div>
                    <div className="text-2xl font-bold text-yellow-600">{stats.warnings}</div>
                </Card>
                <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Work Jumps</div>
                    <div className="text-2xl font-bold text-blue-600">{stats.workJumps}</div>
                </Card>
            </div>

            {/* Drop Zone Mapping Section */}
            {stats.newDropZones > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>New Drop Zones Detected</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {Array.from(new Set(processedJumps
                                .filter(j => j._dropZoneMatch?.isNew)
                                .map(j => j._dropZoneMatch?.original)))
                                .map(dz => {
                                    if (!dz) return null
                                    const match = fuzzyMatchDropZone(dz, existingDropZones)
                                    return (
                                        <div key={dz} className="flex items-center gap-2 p-2 border rounded">
                                            <span className="font-medium">{dz}</span>
                                            {match && match.confidence > 50 && (
                                                <>
                                                    <span className="text-sm text-muted-foreground">→</span>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => mapDropZone(dz, match.match)}
                                                    >
                                                        Map to "{match.match}" ({match.confidence}% match)
                                                    </Button>
                                                </>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => mapDropZone(dz, dz, true)}
                                                className="ml-auto"
                                            >
                                                <Plus className="w-4 h-4 mr-1" />
                                                Create New
                                            </Button>
                                        </div>
                                    )
                                })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Jump Preview Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Jump Data Preview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {processedJumps.map((jump, index) => (
                            <div key={index} className="border rounded-lg">
                                {/* Summary Row */}
                                <div
                                    className={`p-3 flex items-center gap-4 cursor-pointer hover:bg-gray-50 ${!jump._isValid ? 'bg-red-50' : jump._warnings.length > 0 ? 'bg-yellow-50' : ''
                                        }`}
                                    onClick={() => toggleRow(index)}
                                >
                                    <div className="flex-shrink-0">
                                        {expandedRows.has(index) ?
                                            <ChevronUp className="w-5 h-5" /> :
                                            <ChevronDown className="w-5 h-5" />
                                        }
                                    </div>

                                    <div className="flex-shrink-0">
                                        {jump._isValid ?
                                            <CheckCircle className="w-5 h-5 text-green-600" /> :
                                            <AlertCircle className="w-5 h-5 text-red-600" />
                                        }
                                    </div>

                                    <div className="flex-1 grid grid-cols-6 gap-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Jump #</span>
                                            <span className="ml-2 font-medium">{jump.jumpNumber || '—'}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Date:</span>
                                            <span className="ml-2">{jump.date ? new Date(jump.date).toLocaleDateString() : '—'}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">DZ:</span>
                                            <span className="ml-2">{jump.dropZone || '—'}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Aircraft:</span>
                                            <span className="ml-2">{jump.aircraft || '—'}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Type:</span>
                                            <span className="ml-2">{jump.jumpType || '—'}</span>
                                        </div>
                                        <div>
                                            {jump.workJump && (
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                                    Work Jump
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {expandedRows.has(index) && (
                                    <div className="p-4 border-t bg-gray-50 space-y-4">
                                        {/* Errors */}
                                        {jump._errors.length > 0 && (
                                            <Alert variant="destructive">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription>
                                                    <div className="space-y-1">
                                                        {jump._errors.map((error, i) => (
                                                            <p key={i}>{error}</p>
                                                        ))}
                                                    </div>
                                                </AlertDescription>
                                            </Alert>
                                        )}

                                        {/* Warnings */}
                                        {jump._warnings.length > 0 && (
                                            <Alert>
                                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                                <AlertDescription>
                                                    <div className="space-y-1">
                                                        {jump._warnings.map((warning, i) => (
                                                            <p key={i}>{warning}</p>
                                                        ))}
                                                    </div>
                                                </AlertDescription>
                                            </Alert>
                                        )}

                                        {/* Editable Fields */}
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="text-sm font-medium">Jump Number</label>
                                                <Input
                                                    type="number"
                                                    value={jump.jumpNumber || ''}
                                                    onChange={(e) => updateJumpField(index, 'jumpNumber', parseInt(e.target.value))}
                                                    className={!jump.jumpNumber ? 'border-red-500' : ''}
                                                />
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium">Date</label>
                                                <Input
                                                    type="date"
                                                    value={jump.date ? new Date(jump.date).toISOString().split('T')[0] : ''}
                                                    onChange={(e) => updateJumpField(index, 'date', new Date(e.target.value))}
                                                    className={!jump.date ? 'border-red-500' : ''}
                                                />
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium">Drop Zone</label>
                                                <select
                                                    value={jump.dropZone || ''}
                                                    onChange={(e) => updateJumpField(index, 'dropZone', e.target.value)}
                                                    className={`w-full px-3 py-2 border rounded-md ${!jump.dropZone ? 'border-red-500' : ''}`}
                                                >
                                                    <option value="">Select...</option>
                                                    {existingDropZones.map(dz => (
                                                        <option key={dz} value={dz}>{dz}</option>
                                                    ))}
                                                    {jump.dropZone && !existingDropZones.includes(jump.dropZone) && (
                                                        <option value={jump.dropZone}>{jump.dropZone} (New)</option>
                                                    )}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium">Aircraft</label>
                                                <Input
                                                    value={jump.aircraft || ''}
                                                    onChange={(e) => updateJumpField(index, 'aircraft', e.target.value)}
                                                    className={!jump.aircraft ? 'border-red-500' : ''}
                                                />
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium">Jump Type</label>
                                                <Input
                                                    value={jump.jumpType || ''}
                                                    onChange={(e) => updateJumpField(index, 'jumpType', e.target.value)}
                                                />
                                            </div>

                                            {jump.workJump && (
                                                <>
                                                    <div>
                                                        <label className="text-sm font-medium">Customer (Optional)</label>
                                                        <Input
                                                            value={jump.customerName || ''}
                                                            onChange={(e) => updateJumpField(index, 'customerName', e.target.value)}
                                                            placeholder="Not required for historical imports"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-sm font-medium">Rate</label>
                                                        <Input
                                                            type="number"
                                                            value={jump.totalRate || ''}
                                                            onChange={(e) => updateJumpField(index, 'totalRate', parseFloat(e.target.value))}
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Remove Jump Button */}
                                        <div className="flex justify-end">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setStagedJumps(prev => prev.filter((_, i) => i !== index))
                                                    expandedRows.delete(index)
                                                }}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <X className="w-4 h-4 mr-1" />
                                                Remove Jump
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between">
                <Button variant="outline" onClick={onCancel}>
                    Cancel Import
                </Button>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setExpandedRows(new Set(processedJumps.map((_, i) => i)))}
                    >
                        Expand All
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setExpandedRows(new Set())}
                    >
                        Collapse All
                    </Button>
                    <Button
                        onClick={handleConfirmImport}
                        disabled={stats.valid === 0}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        Import {stats.valid} Jump{stats.valid !== 1 ? 's' : ''}
                    </Button>
                </div>
            </div>
        </div>
    )
}