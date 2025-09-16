import type { JumpRecord } from "@/types/jumpRecord"
import type { DropZone } from "@/types/dropzone"

export const filterJumpsByCountry = (jumps: JumpRecord[], country: string, dropZones: DropZone[]) => {
  return jumps.filter(jump => {
    const dz = dropZones.find(d => d.name === jump.dropZone)
    return dz?.country === country
  })
}

export const filterJumpsByDropZone = (jumps: JumpRecord[], dropZone: string) => {
  return jumps.filter(jump => jump.dropZone === dropZone)
}

export const filterJumpsByYear = (jumps: JumpRecord[], year: string) => {
  return jumps.filter(jump => {
    const jumpYear = (jump.date instanceof Date ? jump.date : new Date(jump.date)).getFullYear()
    return jumpYear.toString() === year
  })
}

export const filterJumpsByType = (jumps: JumpRecord[], type: string) => {
  return jumps.filter(jump => jump.jumpType === type)
}

export const filterJumpsByAircraft = (jumps: JumpRecord[], aircraft: string) => {
  return jumps.filter(jump => jump.aircraft === aircraft)
}

export const filterJumpsByGear = (jumps: JumpRecord[], gear: string) => {
  return jumps.filter(jump => {
    return jump.gearUsed && Array.isArray(jump.gearUsed) && jump.gearUsed.includes(gear)
  })
}

export const filterJumpsByService = (jumps: JumpRecord[], service: string) => {
  return jumps.filter(jump => {
    return jump.invoiceItems && jump.invoiceItems.includes(service)
  })
}

export const filterJumpsByCutaway = (jumps: JumpRecord[]) => {
  return jumps.filter(jump => jump.cutaway === true)
}

export const filterJumpsByMonth = (jumps: JumpRecord[], month: number, year: number) => {
  return jumps.filter(jump => {
    const jumpDate = jump.date instanceof Date ? jump.date : new Date(jump.date)
    return jumpDate.getMonth() === month && jumpDate.getFullYear() === year
  })
}

export const filterJumpsByDateRange = (jumps: JumpRecord[], startDate: Date, endDate: Date) => {
  return jumps.filter(jump => {
    const jumpDate = jump.date instanceof Date ? jump.date : new Date(jump.date)
    return jumpDate >= startDate && jumpDate <= endDate
  })
}

export const filterWorkJumps = (jumps: JumpRecord[]) => {
  return jumps.filter(jump => jump.workJump === true)
}

export const filterSportJumps = (jumps: JumpRecord[]) => {
  return jumps.filter(jump => jump.workJump === false)
}