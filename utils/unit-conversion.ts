export const feetToMeters = (feet: number): number => {
  return Math.round(feet * 0.3048)
}

export const metersToFeet = (meters: number): number => {
  return Math.round(meters / 0.3048)
}

export const formatAltitude = (altitude: number, units: "feet" | "meters"): string => {
  return `${altitude}${units === "feet" ? "ft" : "m"}`
}

export const convertAltitude = (altitude: number, fromUnits: "feet" | "meters", toUnits: "feet" | "meters"): number => {
  if (fromUnits === toUnits) return altitude

  if (fromUnits === "feet" && toUnits === "meters") {
    return feetToMeters(altitude)
  } else if (fromUnits === "meters" && toUnits === "feet") {
    return metersToFeet(altitude)
  }

  return altitude
}
