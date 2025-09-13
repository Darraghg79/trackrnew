"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { SignatureCanvas } from "@/components/signature-canvas"
import type { JumpRecord, JumpSignature } from "@/types/jump-record"

interface JumpSigningFlowProps {
  jumps: JumpRecord[]
  selectedJumpNumbers: number[]
  onComplete: (signature: JumpSignature, jumpNumbers: number[]) => void
  onCancel: () => void
}

export const JumpSigningFlow: React.FC<JumpSigningFlowProps> = ({
  jumps,
  selectedJumpNumbers,
  onComplete,
  onCancel,
}) => {
  const [step, setStep] = useState<"licence" | "signature">("licence")
  const [licenceNumber, setLicenceNumber] = useState("")
  const [error, setError] = useState("")

  const selectedJumps = jumps.filter((jump) => selectedJumpNumbers.includes(jump.jumpNumber))

  const handleLicenceNext = () => {
    if (!licenceNumber.trim()) {
      setError("Licence number is required")
      return
    }
    setError("")
    setStep("signature")
  }

  const handleSignatureComplete = (signatureData: string) => {
    const signature: JumpSignature = {
      licenceNumber: licenceNumber.trim(),
      signatureData,
      signedDate: new Date(),
    }

    onComplete(signature, selectedJumpNumbers)
  }

  const handleSignatureCancel = () => {
    if (step === "signature") {
      setStep("licence")
    } else {
      onCancel()
    }
  }

  if (step === "signature") {
    return <SignatureCanvas onSignatureComplete={handleSignatureComplete} onCancel={handleSignatureCancel} />
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Sign Jump Records</h1>
          <Button variant="ghost" onClick={onCancel} className="text-gray-600">
            Cancel
          </Button>
        </div>

        {/* Selected Jumps Summary */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="font-medium text-gray-900 mb-3">Selected Jumps ({selectedJumps.length})</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {selectedJumps.map((jump) => (
                <div key={jump.jumpNumber} className="flex justify-between items-center text-sm">
                  <span className="font-medium">Jump #{jump.jumpNumber}</span>
                  <span className="text-gray-600">
                    {new Date(jump.date).toLocaleDateString()} - {jump.dropZone}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Licence Number Input */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="licenceNumber">Instructor Licence Number *</Label>
                <Input
                  id="licenceNumber"
                  value={licenceNumber}
                  onChange={(e) => {
                    setLicenceNumber(e.target.value)
                    setError("")
                  }}
                  placeholder="Enter your licence number"
                  error={error}
                />
                {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
              </div>

              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> By signing these jump records, you certify that all information is accurate and
                  that the jumps were conducted in accordance with safety regulations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Button */}
        <Button
          onClick={handleLicenceNext}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
          disabled={!licenceNumber.trim()}
        >
          Next: Digital Signature
        </Button>
      </div>
    </div>
  )
}
